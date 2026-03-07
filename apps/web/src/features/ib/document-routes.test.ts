import { canonicalIbHrefForDocument, isIbDocument } from "@/features/ib/document-routes";

describe("ib document routes", () => {
  it("detects IB documents from pack and type metadata", () => {
    expect(
      isIbDocument({
        document_type: "ib_pyp_unit",
        pack_key: "ib_continuum_v1",
        schema_key: "ib.pyp.unit@v2",
      } as never),
    ).toBe(true);
  });

  it("builds canonical routes for IB curriculum documents", () => {
    expect(
      canonicalIbHrefForDocument({
        id: 55,
        document_type: "ib_dp_course_map",
        schema_key: "ib.dp.course_map@v2",
      } as never),
    ).toBe("/ib/dp/course-maps/55");
  });
});
