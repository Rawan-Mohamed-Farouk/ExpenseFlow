module Api
  module V1
    module Admin
      class TeamsController < ApplicationController
        before_action :require_admin!
        before_action :set_team, only: [:show, :update]

        # GET /api/v1/admin/teams
        def index
          teams = Team.includes(:manager, :members).order(:name)
          render json: {
            teams: teams.map { |t|
              {
                id: t.id,
                name: t.name,
                manager: {
                  id: t.manager.id,
                  name: t.manager.name,
                  email: t.manager.email
                },
                members_count: t.members.count,
                members: t.members.map { |m| { id: m.id, name: m.name, email: m.email, role: m.role, is_active: m.is_active } }
              }
            }
          }, status: :ok
        end

        # GET /api/v1/admin/teams/:id
        def show
          render json: {
            team: {
              id: @team.id,
              name: @team.name,
              manager: {
                id: @team.manager.id,
                name: @team.manager.name,
                email: @team.manager.email
              },
              members: @team.members.map { |m| { id: m.id, name: m.name, email: m.email, role: m.role, is_active: m.is_active } }
            }
          }, status: :ok
        end

        # POST /api/v1/admin/teams
        def create
          team = Team.new(team_params)
          if team.save
            render json: { team: team, message: "Team created successfully." }, status: :created
          else
            render json: { errors: team.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/admin/teams/:id
        def update
          if @team.update(team_params)
            render json: { team: @team, message: "Team updated successfully." }, status: :ok
          else
            render json: { errors: @team.errors.full_messages }, status: :unprocessable_entity
          end
        end

        private

        def set_team
          @team = Team.find_by(id: params[:id])
          unless @team
            render json: { error: "Team not found." }, status: :not_found
          end
        end

        def team_params
          params.require(:team).permit(:name, :manager_id)
        end
      end
    end
  end
end
