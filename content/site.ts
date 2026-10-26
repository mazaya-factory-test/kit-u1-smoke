// synthetic: true
// Stand-in copy so the starter builds and its gates run. The build lane replaces
// every value with the client's VERIFIED copy from spec/; a site never ships synthetic text.
export const synthetic = true;

export const site = {
  tagline: "A short line that says what Kit U1 Smoke does and for whom.",
  intro:
    "Two or three sentences that introduce the organisation, in its own words, taken from the scoped questionnaire answers.",
  about: [
    "Who the organisation is and why it exists.",
    "What it has done so far, stated only as facts the client has confirmed.",
  ],
  services: [
    { title: "First offering", body: "One or two sentences about the first thing visitors can do or get." },
    { title: "Second offering", body: "One or two sentences about the second." },
    { title: "Third offering", body: "One or two sentences about the third." },
  ],
  contact: {
    email: "hello@example.org",
    note: "We read every message and reply within a few working days.",
  },
} as const;
