require "csv"

module Api
  module V1
    class ReportsController < ApplicationController
      include ActionController::MimeResponds
      before_action :require_admin!

      # GET /api/v1/reports
      def index
        start_date = params[:start_date].present? ? Date.parse(params[:start_date]) : (Date.current - 5.months).beginning_of_month
        end_date = params[:end_date].present? ? Date.parse(params[:end_date]) : Date.current

        expenses = Expense.where(status: %w[approved reimbursed])
                          .where(spent_date: start_date..end_date)
                          .includes(:category)

        grouped = {}
        categories_by_id = Category.all.index_by(&:id)

        expenses.each do |exp|
          month = exp.spent_date.strftime("%Y-%m")
          key = [month, exp.category_id]

          grouped[key] ||= {
            month: month,
            category_id: exp.category_id,
            category_name: categories_by_id[exp.category_id]&.name || "Unknown",
            approved_count: 0,
            approved_amount: 0.0,
            reimbursed_count: 0,
            reimbursed_amount: 0.0,
            total_count: 0,
            total_amount: 0.0
          }

          amount = exp.amount.to_f
          if exp.status == "approved"
            grouped[key][:approved_count] += 1
            grouped[key][:approved_amount] += amount
          elsif exp.status == "reimbursed"
            grouped[key][:reimbursed_count] += 1
            grouped[key][:reimbursed_amount] += amount
          end
          grouped[key][:total_count] += 1
          grouped[key][:total_amount] += amount
        end

        breakdown = grouped.values.sort_by { |item| [item[:month], item[:category_name]] }

        total_approved_amount = breakdown.sum { |b| b[:approved_amount] }.round(2)
        total_approved_count = breakdown.sum { |b| b[:approved_count] }
        total_reimbursed_amount = breakdown.sum { |b| b[:reimbursed_amount] }.round(2)
        total_reimbursed_count = breakdown.sum { |b| b[:reimbursed_count] }
        grand_total_amount = (total_approved_amount + total_reimbursed_amount).round(2)
        grand_total_count = total_approved_count + total_reimbursed_count

        summary = {
          start_date: start_date.to_s,
          end_date: end_date.to_s,
          total_approved_amount: total_approved_amount,
          total_approved_count: total_approved_count,
          total_reimbursed_amount: total_reimbursed_amount,
          total_reimbursed_count: total_reimbursed_count,
          grand_total_amount: grand_total_amount,
          grand_total_count: grand_total_count
        }

        if request.format.csv? || params[:format] == "csv"
          csv_data = generate_csv(breakdown, summary)
          send_data csv_data, filename: "expense-report-#{start_date}-to-#{end_date}.csv", type: "text/csv"
        else
          render json: {
            summary: summary,
            breakdown: breakdown
          }, status: :ok
        end
      end

      private

      def generate_csv(breakdown, summary)
        CSV.generate(headers: true) do |csv|
          csv << ["Month", "Category", "Approved Count", "Approved Amount ($)", "Reimbursed Count", "Reimbursed Amount ($)", "Total Count", "Total Amount ($)"]
          breakdown.each do |row|
            csv << [
              row[:month],
              row[:category_name],
              row[:approved_count],
              format("%.2f", row[:approved_amount]),
              row[:reimbursed_count],
              format("%.2f", row[:reimbursed_amount]),
              row[:total_count],
              format("%.2f", row[:total_amount])
            ]
          end
          csv << []
          csv << ["Summary Totals", "", "Approved ($)", format("%.2f", summary[:total_approved_amount]), "Reimbursed ($)", format("%.2f", summary[:total_reimbursed_amount]), "Grand Total ($)", format("%.2f", summary[:grand_total_amount])]
        end
      end
    end
  end
end
