"use strict";

// Node.js projekt zippelő
// Készítette Tóta Dávid

const glob = require("glob");
const inquirer = require("inquirer");
const fs = require("fs").promises;
const { promisify } = require("util");
const colors = require("colors");
const date = require("date-and-time");
const Zip = require("adm-zip");
const path = require("path");
const slug = require("slug");
const filesize = require("filesize");
const _ = require("loadsh");
const config = require("./zip.config");

const pGlob = promisify(glob);
const currentDate = new Date();

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
Kelt: {DATE}`;

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

const zipFiles = async (files, { name, neptun }) => {
    const zip = new Zip();
    for (const file of files) {
        process.stdout.write(`   * becsomagolás: ${colors.grey(file)}... `);
        zip.addLocalFile(file, path.parse(file).dir);
        console.log(colors.green("OK."));
    }
    const formattedDate = date.format(new Date(), "YYMMDDHHmmss");
    const nameSlug = slug(name, { replacement: "_", lower: false });
    const task = slug(config.task, { replacement: "_" });
    const zipName = `${nameSlug}_${neptun}_${task}_${formattedDate}.zip`;
    const zipPath = `zipfiles/${zipName}`;
    process.stdout.write(" 3. Archívum mentése ide: " + colors.gray(zipPath) + "... ");
    zip.writeZip(zipPath);
    const zipSize = filesize((await fs.stat(zipPath)).size);
    console.log(colors.white(`${colors.green("OK")}, méret: ${colors.gray(zipSize)}.`));
};

const handleStatement = async () => {
    // Korábbi kitöltés ellenőrzése és validálása
    let data = await getStatementData();

    if (data.exists) {
        if (data.valid) {
            console.log(
                colors.green(
                    `>> A nyilatkozat (${colors.yellow("statement.txt")}) korábban ki lett töltve ${colors.yellow(
                        data.name
                    )} névre és ${colors.yellow(data.neptun)} Neptun kódra.`
                )
            );
            console.log(" ");
            // Ha korábban ki lett töltve, itt végeztünk is
            return { name: data.name, neptun: data.neptun };
        } else {
            console.log(
                colors.yellow(`>> A nyilatkozat (${colors.white("statement.txt")}) létezik, de úgy értékeltük, hogy a tartalma érvénytelen.`)
            );
            console.log(" ");
        }
    }

    // Nyilatkozat szövegének megjelenítése
    for (const line of statementTemplate.split("\n")) {
        console.log(`${line}`.gray);
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
        console.log(">> Elfogadtad a nyilatkozatot. Kérjük, add meg az adataidat, hogy be tudjuk azokat helyettesíteni a nyilatkozatba.".green);
    } else {
        console.log(
            ">> A tárgy követelményei szerint a nyilatkozat elfogadása és mellékelése kötelező, ezért ha nem fogadod el, akkor nem tudjuk értékelni a zárthelyidet."
                .red
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
        colors.green(
            `>> A nyilatkozat (${colors.yellow("statement.txt")}) sikeresen ki lett töltve ${colors.yellow(name)} névre és ${colors.yellow(
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
    console.log(colors.green("OK."));

    console.log(" 2. Fájlok becsomagolása...");
    await zipFiles(files, { name, neptun });
};

(async () => {
    try {
        console.log("1. lépés: Nyilatkozat".bgGray.black);
        console.log(" ");
        const { name, neptun } = await handleStatement();

        console.log("2. lépés: Fájlok becsomagolása".bgGray.black);
        console.log(" ");
        await handleZipping({ name, neptun });

        // Tudnivalók megjelenítése
        console.log(" ");
        console.log(colors.yellow(" * A feladatot a Canvas rendszeren keresztül kell beadni a határidő lejárta előtt."));
        console.log(" ");
        console.log(colors.yellow(" * Az időkeret utolsó 15 percét a beadás nyugodt és helyes elvégzésére adjuk."));
        console.log(colors.yellow(" * A feladat megfelelő, hiánytalan beadása a hallgató felelőssége!"));
        console.log(colors.yellow(" * Utólagos reklamációra nincs lehetőség! Mindenképp ellenőrizd a .zip fájlt, mielőtt beadod!"));
    } catch (e) {
        if (e.message === "StatementDenied") {
            return;
        }
        throw e;
    }
})();
