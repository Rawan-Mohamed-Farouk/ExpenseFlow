class CreateRevokedTokens < ActiveRecord::Migration[8.1]
  def change
    create_table :revoked_tokens do |t|
      t.string :jti, null: false
      t.datetime :revoked_at, null: false
    end

    add_index :revoked_tokens, :jti, unique: true
    add_index :revoked_tokens, :revoked_at
  end
end
