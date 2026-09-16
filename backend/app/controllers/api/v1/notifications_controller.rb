module Api
  module V1
    class NotificationsController < ApplicationController
      # GET /api/v1/notifications
      def index
        notifications = current_user.notifications.recent.limit(50)
        unread_count = current_user.notifications.unread.count

        render json: {
          notifications: notifications.map { |n|
            {
              id: n.id,
              expense_id: n.expense_id,
              message: n.message,
              is_read: n.is_read,
              created_at: n.created_at
            }
          },
          unread_count: unread_count
        }, status: :ok
      end

      # PATCH /api/v1/notifications/:id/read
      def mark_as_read
        notification = current_user.notifications.find_by(id: params[:id])
        if notification
          notification.update(is_read: true)
          render json: { message: "Marked as read." }, status: :ok
        else
          render json: { error: "Notification not found." }, status: :not_found
        end
      end

      # POST /api/v1/notifications/mark_all_read
      def mark_all_read
        current_user.notifications.unread.update_all(is_read: true)
        render json: { message: "All notifications marked as read." }, status: :ok
      end
    end
  end
end
