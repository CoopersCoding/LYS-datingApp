# This file is auto-generated from the current state of the database.
# Check this file into version control so new environments can load the current schema.

ActiveRecord::Schema.define(version: 2026_09_18_190000) do

  create_table "connections", force: :cascade do |t|
    t.integer "requester_id"
    t.integer "recipient_id"
    t.string "connection_type"
    t.string "status"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["recipient_id"], name: "index_connections_on_recipient_id"
    t.index ["requester_id", "recipient_id"], name: "index_connections_on_requester_id_and_recipient_id", unique: true
    t.index ["requester_id"], name: "index_connections_on_requester_id"
  end

  create_table "conversations", force: :cascade do |t|
    t.integer "connection_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["connection_id"], name: "index_conversations_on_connection_id", unique: true
  end

  create_table "interests", force: :cascade do |t|
    t.string "name"
    t.string "category"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
  end

  create_table "messages", force: :cascade do |t|
    t.integer "conversation_id", null: false
    t.integer "user_id", null: false
    t.text "body"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["conversation_id"], name: "index_messages_on_conversation_id"
    t.index ["user_id"], name: "index_messages_on_user_id"
  end

  create_table "user_interests", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "interest_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["interest_id"], name: "index_user_interests_on_interest_id"
    t.index ["user_id", "interest_id"], name: "index_user_interests_on_user_id_and_interest_id", unique: true
    t.index ["user_id"], name: "index_user_interests_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "first_name"
    t.string "last_name"
    t.string "email"
    t.string "password_digest"
    t.date "birthdate"
    t.string "city"
    t.string "state"
    t.string "gender"
    t.text "bio"
    t.text "profile_image_url"
    t.boolean "looking_for_friendship"
    t.boolean "looking_for_romance"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "conversations", "connections"
  add_foreign_key "messages", "conversations"
  add_foreign_key "messages", "users"
  add_foreign_key "user_interests", "interests"
  add_foreign_key "user_interests", "users"
end
