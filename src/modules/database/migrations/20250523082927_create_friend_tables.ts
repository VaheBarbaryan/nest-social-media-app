import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('friend_requests', (table) => {
    table.increments('id').primary();
    table.integer('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('receiver_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['sender_id', 'receiver_id']);
  });

  await knex.schema.createTable('friends', (table) => {
    table.increments('id');
    table.integer('user_id_1').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('user_id_2').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index(['user_id_1', 'user_id_2']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('friends');
  await knex.schema.dropTable('friend_requests');
}