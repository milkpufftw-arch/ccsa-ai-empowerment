/** 正式原檔放在 public/branding/ccsa-logo.png；不描摹、不裁切、不改色。 */
const logos = import.meta.glob("/public/branding/ccsa-logo.png", {
  eager: true,
  query: "?url",
  import: "default",
});
export default function OrganizationMark() {
  return Object.keys(logos).length ? (
    <img
      className="organization-logo"
      src="/branding/ccsa-logo.png"
      alt="CCSA 中華育幼機構兒童關懷協會"
    />
  ) : (
    <b>CCSA</b>
  );
}
