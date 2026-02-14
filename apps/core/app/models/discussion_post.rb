class DiscussionPost < ApplicationRecord
  include TenantScoped

  belongs_to :discussion
  belongs_to :created_by, class_name: "User"
  belongs_to :parent_post, class_name: "DiscussionPost", optional: true
  has_many :replies, class_name: "DiscussionPost", foreign_key: :parent_post_id, dependent: :destroy

  validates :content, presence: true
  validate :discussion_must_be_open

  private

  def discussion_must_be_open
    return unless discussion

    unless discussion.status == "open"
      errors.add(:base, "Cannot post to a #{discussion.status} discussion")
    end
  end
end
