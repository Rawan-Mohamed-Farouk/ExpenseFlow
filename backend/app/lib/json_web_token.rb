class JsonWebToken
  SECRET_KEY = Rails.application.secret_key_base

  def self.encode(payload, exp = 24.hours.from_now)
    payload = payload.merge(exp: exp.to_i, jti: SecureRandom.uuid)
    JWT.encode(payload, SECRET_KEY, "HS256")
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: "HS256" })[0]
    payload = HashWithIndifferentAccess.new(decoded)
    return nil if payload[:jti].blank? || RevokedToken.exists?(jti: payload[:jti])

    payload
  rescue JWT::DecodeError, JWT::ExpiredSignature => e
    nil
  end

  def self.revoke(token)
    payload = decode_without_revocation(token)
    return false if payload.nil? || payload[:jti].blank?

    RevokedToken.create_or_find_by!(jti: payload[:jti]) do |revoked_token|
      revoked_token.revoked_at = Time.current
    end
    true
  rescue ActiveRecord::RecordNotUnique
    true
  end

  def self.decode_without_revocation(token)
    decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: "HS256" })[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end
end
