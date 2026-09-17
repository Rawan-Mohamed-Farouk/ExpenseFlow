require "rails_helper"

RSpec.describe "Auth API", type: :request do
  let!(:user) { User.create!(name: "Jane Doe", email: "jane@test.com", password: "password123", role: "employee") }
  let!(:inactive_user) { User.create!(name: "Inactive User", email: "inactive@test.com", password: "password123", role: "employee", is_active: false) }

  describe "POST /api/v1/auth/login" do
    it "authenticates with valid credentials and returns token + user" do
      post "/api/v1/auth/login", params: { email: "jane@test.com", password: "password123" }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["token"]).to be_present
      expect(json["user"]["email"]).to eq("jane@test.com")
    end

    it "rejects invalid credentials" do
      post "/api/v1/auth/login", params: { email: "jane@test.com", password: "wrong" }
      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects deactivated users immediately" do
      post "/api/v1/auth/login", params: { email: "inactive@test.com", password: "password123" }
      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json["error"]).to include("deactivated")
    end
  end

  describe "GET /api/v1/me" do
    it "returns current user profile when authorized" do
      get "/api/v1/me", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["user"]["name"]).to eq("Jane Doe")
    end

    it "rejects request without token" do
      get "/api/v1/me"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "DELETE /api/v1/auth/logout" do
    it "returns success message and revokes the token" do
      headers = auth_headers(user)
      delete "/api/v1/auth/logout", headers: headers
      expect(response).to have_http_status(:ok)

      get "/api/v1/me", headers: headers
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
