class ExpandProfileImageUrlForUploads < ActiveRecord::Migration[6.1]
  def up
    change_column :users, :profile_image_url, :text
  end

  def down
    change_column :users, :profile_image_url, :string
  end
end
