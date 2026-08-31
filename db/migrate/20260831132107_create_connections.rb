class CreateConnections < ActiveRecord::Migration[6.1]
  def change
    create_table :connections do |t|
      t.integer :requester_id
      t.integer :recipient_id
      t.string :connection_type
      t.string :status

      t.timestamps
    end
  end
end
