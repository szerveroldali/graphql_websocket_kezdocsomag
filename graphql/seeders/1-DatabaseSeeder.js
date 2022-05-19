"use strict";

// Faker dokumentáció, API referencia: https://fakerjs.dev/guide/#node-js
const { faker } = require("@faker-js/faker");
const models = require("../models");
const { User /* ... */ } = models;
const chalk = require("chalk");

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            // Felhasználók
            const usersCount = faker.datatype.number({ min: 1, max: 3 });
            const users = [];
            users.push(
                await User.create({
                    name: "Admin",
                    email: "admin@szerveroldali.hu",
                    password: "password",
                    isAdmin: true,
                })
            );
            for (let i = 1; i <= usersCount; i++) {
                users.push(
                    await User.create({
                        name: faker.name.findName(),
                        email: `user${i}@szerveroldali.hu`,
                        password: "password",
                    })
                );
            }

            // Egyéb...

            console.log(chalk.green("A DatabaseSeeder lefutott"));
        } catch (e) {
            // Ha a seederben valamilyen hiba van, akkor alapértelmezés szerint elég szegényesen írja
            // ki azokat a rendszer a seeder futtatásakor. Ezért ez Neked egy segítség, hogy láthasd a
            // hiba részletes kiírását.
            // Így ha valamit elrontasz a seederben, azt könnyebben tudod debug-olni.
            console.log(chalk.red("A DatabaseSeeder nem futott le teljesen, mivel az alábbi hiba történt:"));
            console.log(chalk.gray(e));
        }
    },

    down: async (queryInterface, Sequelize) => {
        /**
         * Add commands to revert seed here.
         *
         * Example:
         * await queryInterface.bulkDelete('People', null, {});
         */
    },
};
