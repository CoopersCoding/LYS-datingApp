class StrengthenBackendConstraints < ActiveRecord::Migration[6.1]
  def change
    add_index :users, :email, unique: true unless index_exists?(:users, :email)
    add_index :user_interests, [:user_id, :interest_id], unique: true unless index_exists?(:user_interests, [:user_id, :interest_id])
    add_index :connections, [:requester_id, :recipient_id], unique: true unless index_exists?(:connections, [:requester_id, :recipient_id])
    add_index :connections, :requester_id unless index_exists?(:connections, :requester_id)
    add_index :connections, :recipient_id unless index_exists?(:connections, :recipient_id)

    unless index_exists?(:conversations, :connection_id, unique: true)
      remove_index :conversations, :connection_id if index_exists?(:conversations, :connection_id)
      add_index :conversations, :connection_id, unique: true
    end
  end
end
