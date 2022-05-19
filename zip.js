"use strict";

// Node.js projekt zippelő
// Készítette Tóta Dávid

const glob = require("glob");
const inquirer = require("inquirer");
const fs = require("fs").promises;
const { promisify } = require("util");
const chalk = require("chalk");
const date = require("date-and-time");
const Zip = require("adm-zip");
const path = require("path");
const slug = require("slug");
const filesize = require("filesize").partial({ base: 2, standard: "jedec" });
const _ = require("lodash");
const crypto = require("crypto");
const { table } = require("table");
const indentString = require("indent-string");
const config = require("./zip.config.js");

const pGlob = promisify(glob);
const currentDate = new Date();

const tableconfig = {
    border: {
        topBody: `─`,
        topJoin: `┬`,
        topLeft: `┌`,
        topRight: `┐`,

        bottomBody: `─`,
        bottomJoin: `┴`,
        bottomLeft: `└`,
        bottomRight: `┘`,

        bodyLeft: `│`,
        bodyRight: `│`,
        bodyJoin: `│`,

        joinBody: `─`,
        joinLeft: `├`,
        joinRight: `┤`,
        joinJoin: `┼`,
    },
};

// Nyilatkozat sablon
const statementTemplate = `NYILATKOZAT
===========
Én, {NAME} (Neptun kód: {NEPTUN}) kijelentem, hogy ezt a megoldást én küldtem be a "{SUBJECT}" tárgy "{TASK}" nevű számonkéréséhez.
A feladat beadásával elismerem, hogy tudomásul vettem a nyilatkozatban foglaltakat.
- Kijelentem, hogy ez a megoldás a saját munkám.
- Kijelentem, hogy nem másoltam vagy használtam harmadik féltől származó megoldásokat.
- Kijelentem, hogy nem továbbítottam megoldást hallgatótársaimnak, és nem is tettem azt közzé.
- Tudomásul vettem, hogy az Eötvös Loránd Tudományegyetem Hallgatói Követelményrendszere (ELTE szervezeti és működési szabályzata, II. Kötet, 74/C. §) kimondja, hogy mindaddig, amíg egy hallgató egy másik hallgató munkáját - vagy legalábbis annak jelentős részét - saját munkájaként mutatja be, az fegyelmi vétségnek számít.
- Tudomásul vettem, hogy a fegyelmi vétség legsúlyosabb következménye a hallgató elbocsátása az egyetemről.

Kelt: {DATE}
`;

// Reguláris kifejezés nevesített csoportokkal, amivel bekérhetők a nyilatkozatban lévő adatok
const statementRegex = new RegExp(
    // A kiindulási pont a nyilatkozat sablonja, csak pár dolgot át kell benne írni,
    // hogy működjön a mintaillesztés
    statementTemplate
        // Speciális karakterek escape-lése
        .replace(/[-[\]()*+?.,\\^$|#\s]/g, "\\$&")
        // Adatok behelyettesítése
        .replace("{NAME}", "(?<name>[^,]+)")
        .replace("{NEPTUN}", "(?<neptun>[0-9a-zA-Z]{6})")
        .replace("{SUBJECT}", '(?<subject>[^"]+)')
        .replace("{TASK}", '(?<task>[^"]+)')
        .replace("{DATE}", "(?<date>[^\n]+)"),
    "gm"
);

const getStatementData = async () => {
    let result = { name: null, neptun: null, exists: false, valid: false };
    try {
        const statementContent = (await fs.readFile("./statement.txt")).toString();
        const match = statementRegex.exec(statementContent);
        if (match && match.groups) {
            return _.merge({}, result, { exists: true, valid: true, ...match.groups });
        }
        return _.merge({}, result, { exists: true });
    } catch (e) {}
    return result;
};

const collectFiles = async () =>
    await pGlob("**", {
        ignore: config.ignore,
        dot: true,
        nodir: true,
    });

const checksum = (content) => {
    return crypto.createHash("md5").update(content, "utf8").digest("hex");
};

const zipFiles = async (files, { name, neptun }) => {
    process.stdout.write(" 2. Fájlok becsomagolása... ");
    const zip = new Zip();
    for (const file of files) {
        zip.addLocalFile(file, path.parse(file).dir);
    }
    console.log(chalk.green("OK."));
    const formattedDate = date.format(new Date(), "YYYYMMDD_HHmmss");
    const nameSlug = slug(name, { replacement: "_", lower: false });
    const task = slug(config.task, { replacement: "_" });
    const zipName = `${nameSlug}_${neptun}_${task}_${formattedDate}.zip`;
    const zipPath = `zipfiles/${zipName}`;
    process.stdout.write(" 3. Archívum mentése ide: " + chalk.gray(zipPath) + "... ");
    zip.writeZip(zipPath);
    const zipSize = filesize((await fs.stat(zipPath)).size);
    console.log(chalk.white(`${chalk.green("OK")}. Méret: ${chalk.gray(zipSize)}.`));

    console.log(" 4. Becsomagolt fájlok ellenőrzése:");
    var zipFile = new Zip(zipPath);
    const checksumTable = [["Fájl", "Eredeti fájl ellenőrző összege", "Becsomagolt fájl ellenőrző összege", "Eredmény"]];
    let checksumMismatch = false;
    for (const file of files) {
        const originalFileChecksum = checksum(await fs.readFile(file));
        const zippedFileChecksum = checksum(zipFile.getEntry(file).getData());
        if (originalFileChecksum !== zippedFileChecksum) {
            checksumMismatch = true;
        }
        checksumTable.push([
            chalk.yellow(file),
            chalk.gray(originalFileChecksum),
            chalk.gray(zippedFileChecksum),
            originalFileChecksum === zippedFileChecksum ? chalk.green("SÉRTETLEN") : chalk.red("SÉRÜLT?"),
        ]);
    }
    console.log(indentString(table(checksumTable, tableconfig), 4));

    console.log(
        indentString(
            chalk.white(
                `Ha egy fájl neve mellett a ${chalk.green(
                    "SÉRTETLEN"
                )} jelző szerepel, az azt jelenti, hogy az ellenőrzés alapján sértetlenül be lett csomagolva a zip-be.`
            ),
            4
        )
    );

    if (checksumMismatch) {
        console.log(
            indentString(
                chalk.bgRed.white(
                    `${chalk.bold("FIGYELEM!")} Úgy érzékeltük, hogy legalább egy fájl sérült lehet. Próbáld újra a becsomagolást!`
                )
            ),
            4
        );
    }
};

const handleStatement = async () => {
    // Korábbi kitöltés ellenőrzése és validálása
    let data = await getStatementData();

    if (data.exists) {
        if (data.valid) {
            console.log(
                chalk.green(
                    `>> A nyilatkozat (${chalk.yellow("statement.txt")}) korábban ki lett töltve ${chalk.yellow(
                        data.name
                    )} névre és ${chalk.yellow(data.neptun)} Neptun kódra.`
                )
            );
            console.log(
                chalk.green(
                    `   Ha a megadott adatok hibásak, töröld a ${chalk.yellow("statement.txt")} fájlt és hívd meg újra a zip parancsot a`
                )
            );
            console.log(chalk.green(`   nyilatkozat kitöltő újboli eléréséhez.`));

            console.log(" ");
            // Ha korábban ki lett töltve, itt végeztünk is
            return { name: data.name, neptun: data.neptun };
        } else {
            console.log(
                chalk.yellow(`>> A nyilatkozat (${chalk.white("statement.txt")}) létezik, de úgy értékeltük, hogy a tartalma érvénytelen.`)
            );
            console.log(" ");
        }
    }

    // Nyilatkozat szövegének megjelenítése
    const statementTemplateReplaced = statementTemplate
        .replace("{SUBJECT}", config.subject)
        .replace("{TASK}", config.task)
        .replace("{DATE}", date.format(currentDate, "YYYY. MM. DD."));
    for (const line of statementTemplateReplaced.split("\n")) {
        console.log(chalk.gray(line));
    }
    console.log(" ");

    // Nyilatkozat elfogadása
    const { accepted } = await inquirer.prompt([
        {
            type: "list",
            name: "accepted",
            message: "Elfogadod a fenti nyilatkozatot?",
            choices: ["Igen", "Nem"],
            filter(answer) {
                return answer.toLowerCase();
            },
        },
    ]);

    if (accepted === "igen") {
        console.log(
            chalk.green(">> Elfogadtad a nyilatkozatot. Kérjük, add meg az adataidat, hogy be tudjuk azokat helyettesíteni a nyilatkozatba.")
        );
    } else {
        console.log(
            chalk.bgRed.white(
                ">> A tárgy követelményei szerint a nyilatkozat elfogadása és mellékelése kötelező, ezért ha nem fogadod el, akkor nem tudjuk értékelni a zárthelyidet."
            )
        );
        throw new Error("StatementDenied");
    }

    // Adatok bekérése
    const questions = [
        {
            type: "input",
            name: "name",
            message: "Mi a neved?",
            validate(name) {
                name = name.trim();
                if (name.length < 2) {
                    return "A név legalább 2 karakter hosszú kell, hogy legyen!";
                }
                if (name.indexOf(" ") === -1) {
                    return "A név legalább 2 részből kell álljon, szóközzel elválasztva!";
                }
                return true;
            },
            filter(name) {
                return name
                    .split(" ")
                    .filter((part) => part.length > 0)
                    .map((part) => {
                        let partLower = part.toLowerCase();
                        return partLower.charAt(0).toUpperCase() + partLower.slice(1);
                    })
                    .join(" ");
            },
        },
        {
            type: "input",
            name: "neptun",
            message: "Mi a Neptun kódod?",
            validate(neptun) {
                neptun = neptun.trim();
                if (neptun.length !== 6) {
                    return "A Neptun kód hossza pontosan 6 karakter, hogy legyen!";
                }
                if (!neptun.match(new RegExp("[0-9A-Za-z]{6}"))) {
                    return "A Neptun kód csak számokból (0-9) és az angol ABC betűiből (A-Z) állhat!";
                }
                return true;
            },
            filter(neptun) {
                return neptun.toUpperCase();
            },
        },
    ];

    const { name, neptun } = await inquirer.prompt(questions);

    // Nyilatkozat kitöltése
    await fs.writeFile(
        "./statement.txt",
        statementTemplate
            .replace("{NAME}", name)
            .replace("{NEPTUN}", neptun)
            .replace("{SUBJECT}", config.subject)
            .replace("{TASK}", config.task)
            .replace("{DATE}", date.format(currentDate, "YYYY. MM. DD. HH:mm:ss"))
    );
    console.log(
        chalk.green(
            `>> A nyilatkozat (${chalk.yellow("statement.txt")}) sikeresen ki lett töltve ${chalk.yellow(name)} névre és ${chalk.yellow(
                neptun
            )} Neptun kódra.`
        )
    );
    console.log(" ");

    return { name, neptun };
};

const handleZipping = async ({ name, neptun }) => {
    // zipfiles mappa elkészítése, ha még nem létezik
    try {
        await fs.mkdir("zipfiles");
    } catch (e) {}

    // Fájlok listájának előállítása, majd az alapján becsomagolás
    process.stdout.write(" 1. Fájlok összegyűjtése... ");
    const files = await collectFiles();
    console.log(chalk.green("OK."));

    await zipFiles(files, { name, neptun });
};

(async () => {
    try {
        console.log(chalk.bgGray.black("1. lépés: Nyilatkozat"));
        console.log(" ");
        const { name, neptun } = await handleStatement();

        console.log(chalk.bgGray.black("2. lépés: Becsomagolás"));
        console.log(" ");
        await handleZipping({ name, neptun });

        // Tudnivalók megjelenítése
        console.log(" ");
        console.log(chalk.bgGray.black("Tudnivalók"));
        console.log(" ");
        console.log(chalk.yellow(" * A feladatot a Canvas rendszeren keresztül kell beadni a határidő lejárta előtt."));
        console.log(chalk.yellow(" * Az időkeret utolsó 15 percét a beadás nyugodt és helyes elvégzésére adjuk."));
        console.log(chalk.yellow(" * A feladat megfelelő, hiánytalan beadása a hallgató felelőssége!"));
        console.log(chalk.yellow(" * Utólagos reklamációra nincs lehetőség! Mindenképp ellenőrizd a .zip fájlt, mielőtt beadod!"));
    } catch (e) {
        if (e.message === "StatementDenied") {
            return;
        }
        throw e;
    }
})();
