/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('user', table => {
    table.boolean('totp_enabled').notNullable().defaultTo(false);
    table.text('totp_secret').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('user', table => {
    table.dropColumn('totp_enabled');
    table.dropColumn('totp_secret');
  });
};