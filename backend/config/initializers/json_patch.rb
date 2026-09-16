# Fix compatibility between Rails ActiveSupport::JSON.decode and json 3.x keyword arguments
module ActiveSupport
  module JSON
    def self.decode(json, options = {})
      data = if options.empty?
        ::JSON.parse(json)
      else
        ::JSON.parse(json, **options)
      end

      if ActiveSupport.parse_json_times
        convert_dates_from(data)
      else
        data
      end
    end
  end
end
