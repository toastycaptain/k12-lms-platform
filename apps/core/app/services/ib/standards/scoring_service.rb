module Ib
  module Standards
    class ScoringService
      class << self
        def packet_summary(packet)
          items = packet.items.to_a
          total = items.length
          reviewed = items.count { |item| item.review_state.in?(%w[in_review approved exported]) }
          approved = items.count { |item| item.review_state == "approved" }
          completeness = total.zero? ? 0 : ((reviewed.to_f / total) * 100).round
          strength =
            if approved >= 6 || completeness >= 90
              "strong"
            elsif approved >= 3 || completeness >= 60
              "established"
            else
              "emerging"
            end

          {
            completeness_score: completeness,
            reviewed_item_count: reviewed,
            approved_item_count: approved,
            total_item_count: total,
            evidence_strength: strength
          }
        end
      end
    end
  end
end
