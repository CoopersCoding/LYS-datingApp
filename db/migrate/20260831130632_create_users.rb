class CreateUsers < ActiveRecord::Migration[6.1]
  def change
    create_table :users do |t|
      t.string :first_name
      t.string :last_name
      t.string :email
      t.string :password_digest
      t.date :birthdate
      t.string :city
      t.string :state
      t.string :gender
      t.text :bio
      t.string :profile_image_url
      t.boolean :looking_for_friendship
      t.boolean :looking_for_romance

      t.timestamps
    end
  end
end
