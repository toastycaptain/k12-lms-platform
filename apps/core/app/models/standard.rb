class Standard < ApplicationRecord
  include TenantScoped

  NODE_KINDS = %w[standard skill concept objective competency strand criterion custom].freeze

  belongs_to :standard_framework
  belongs_to :parent, class_name: "Standard", optional: true
  has_many :children, class_name: "Standard", foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent
  has_many :curriculum_document_version_alignments, dependent: :destroy

  validates :kind, presence: true, inclusion: { in: NODE_KINDS }
  validate :node_identity_present

  scope :roots, -> { where(parent_id: nil) }
  scope :for_framework, ->(framework_id) { framework_id.present? ? where(standard_framework_id: framework_id) : all }
  scope :for_kind, ->(value) { value.present? ? where(kind: value) : all }
  scope :for_grade_band, ->(value) { value.present? ? where(grade_band: value) : all }
  scope :search, ->(query) {
    q = query.to_s.strip
    if q.present?
      like = "%#{sanitize_sql_like(q)}%"
      where(
        "search_vector @@ plainto_tsquery('english', :q) OR "\
        "coalesce(standards.code, '') ILIKE :like OR "\
        "coalesce(standards.identifier, '') ILIKE :like OR "\
        "coalesce(standards.label, '') ILIKE :like OR "\
        "coalesce(standards.description, '') ILIKE :like",
        q: q,
        like: like
      )
    else
      all
    end
  }

  after_commit :bust_standards_cache

  def tree
    all_descendants = Standard.where(standard_framework_id: standard_framework_id).to_a
    self.class.build_subtree(all_descendants, id)
  end

  def self.build_tree(standards)
    grouped = standards.group_by(&:parent_id)
    build_nodes(grouped, nil)
  end

  def self.search_ranked(query)
    q = query.to_s.strip
    return all unless q.present?

    quoted = connection.quote(q)
    like = "%#{sanitize_sql_like(q)}%"
    where(
      "search_vector @@ plainto_tsquery('english', :q) OR "\
      "coalesce(standards.code, '') ILIKE :like OR "\
      "coalesce(standards.identifier, '') ILIKE :like OR "\
      "coalesce(standards.label, '') ILIKE :like OR "\
      "coalesce(standards.description, '') ILIKE :like",
      q: q,
      like: like
    )
      .select(Arel.sql("standards.*, ts_rank(search_vector, plainto_tsquery('english', #{quoted})) AS search_rank"))
      .order(Arel.sql("search_rank DESC NULLS LAST, standards.updated_at DESC"))
  end

  def self.build_nodes(grouped, parent_id)
    (grouped[parent_id] || []).map do |standard|
      {
        id: standard.id,
        code: standard.code,
        identifier: standard.identifier,
        label: standard.label,
        kind: standard.kind,
        description: standard.description,
        grade_band: standard.grade_band,
        children: build_nodes(grouped, standard.id)
      }
    end
  end

  def self.build_subtree(standards, root_id)
    root = standards.find { |s| s.id == root_id }
    return nil unless root

    grouped = standards.group_by(&:parent_id)
    {
      id: root.id,
      code: root.code,
      identifier: root.identifier,
      label: root.label,
      kind: root.kind,
      description: root.description,
      grade_band: root.grade_band,
      children: build_nodes(grouped, root.id)
    }
  end

  private

  def node_identity_present
    return if code.to_s.strip.present? || identifier.to_s.strip.present? || label.to_s.strip.present?

    errors.add(:base, "at least one of code, identifier, or label must be present")
  end

  def bust_standards_cache
    tenant_ids = [ tenant_id, tenant_id_before_last_save ].compact.uniq
    framework_ids = [ standard_framework_id, standard_framework_id_before_last_save ].compact.uniq

    tenant_ids.each do |tid|
      Rails.cache.delete("tenant:#{tid}:standards:all")
      Rails.cache.delete("tenant:#{tid}:standard_frameworks")
      framework_ids.each do |framework_id|
        Rails.cache.delete("tenant:#{tid}:standards:#{framework_id}")
      end
      begin
        Rails.cache.delete_matched("tenant:#{tid}:standards:*")
      rescue StandardError
        nil
      end
    end
  end
end
