/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_recovery_codes', table => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .notNullable()
      .unsigned()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');

    table.string('code_hash', 255).notNullable();
    table.boolean('used').notNullable().defaultTo(false);
    table.timestamp('used_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_recovery_codes');
};
