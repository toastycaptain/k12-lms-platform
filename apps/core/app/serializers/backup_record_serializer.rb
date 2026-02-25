class BackupRecordSerializer < ActiveModel::Serializer
  attributes :id,
    :backup_type,
    :status,
    :s3_key,
    :s3_bucket,
    :size_bytes,
    :size_mb,
    :duration_seconds,
    :metadata,
    :error_message,
    :verified_at,
    :verification_result,
    :created_at,
    :updated_at
end
