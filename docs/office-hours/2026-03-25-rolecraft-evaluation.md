# Rolecraft Office-Hours Evaluation

Date: 2026-03-25
Mode: Startup
Branch: `main`

## One-line verdict

This is a good project if it becomes a **trustworthy, human-in-the-loop application copilot for serious candidates**. It is a weak project if it tries to become a generic "AI auto-apply to everything" product.

## The Office-Hours Questions

### 1. Who is the desperate user?

Not every job seeker.

The strongest initial user is:

- an engineer, product manager, or designer
- applying to a moderate number of high-value roles, not blasting 1,000 applications
- using common startup hiring systems like Greenhouse, Lever, and Ashby
- tired of re-entering the same information and rewriting the same resume bullets
- unwilling to trust a black-box bot to submit on their behalf

That user wants leverage without losing control.

### 2. What painful thing are they doing today?

Today they usually stitch together:

- job boards
- a spreadsheet or tracker
- ChatGPT or Claude for resume rewrites
- manual copy/paste into ATS forms
- screenshots, notes, or memory to remember what happened

The pain is not only "typing into forms." The deeper pain is:

- deciding which jobs are worth real effort
- tailoring materials fast without inventing facts
- keeping answers consistent across applications
- reviewing automation failures before they become embarrassing mistakes

### 3. What is the status quo?

The market already covers two crowded positions:

1. Hosted job-search workbenches like Simplify and Teal
2. Full-automation promises like LazyApply and Sonara

That means "we help with job applications" is not enough. The project only stands out if it leans hard into:

- transparency
- evidence
- truthful resume tailoring
- manual final approval
- privacy/local-first control

### 4. What is the narrowest winning wedge?

The wedge is not "all job seekers."

The wedge is:

**high-intent knowledge workers applying to startup-style roles on Greenhouse, Lever, and Ashby who want faster applications without surrendering final control**

Concretely, the product should win on one loop:

1. Import a job from a supported ATS
2. Analyze fit against a structured profile
3. Generate a truthful tailored resume
4. Prefill the application as far as safely possible
5. Show screenshots, unresolved items, and logs
6. Stop before submit

That is already the shape of this repo, which is a good sign.

### 5. What do we know from observation?

We know the product intuition is strong.

Evidence from the repo:

- the README clearly rejects unsafe "one-click apply" positioning
- the MVP loop is implemented end-to-end
- ATS-specific importers already exist for Greenhouse, Lever, and Ashby
- the repo includes substantial test coverage and alpha-release packaging

What we do **not** know yet:

- whether users care enough about transparency to switch from hosted incumbents
- whether users will tolerate local-first setup
- whether this workflow improves interview rate or just feels better
- which parts of the loop save the most real time

So the project has product taste, but not yet demand proof.

### 6. Why now?

Now is a reasonable time because:

- LLMs are finally good enough to produce structured analysis and resume rewrites
- browser automation is strong enough for best-effort prefills
- users have already been educated by current products to expect job-search assistance software

But that also means the market is noisier. If the product is not clearly opinionated, it will be swallowed by simpler hosted tools on one side and louder auto-apply promises on the other.

## Eureka

Everyone assumes the winning job-search product is "more automation."

That is probably wrong here.

The better thesis is:

**job seekers do not actually want maximum automation; they want maximum leverage with visible control at the moments that can damage their candidacy**

If that thesis is true, Rolecraft should optimize for trust and evidence, not hidden submission volume.

## Recommendation

Continue the project if the goal is one of these:

- an open-source reference implementation for human-in-the-loop job application workflows
- a niche tool for privacy-conscious or quality-sensitive job seekers
- a premium workflow for candidates targeting competitive startup and tech roles

Do not continue on the current thesis if the goal is:

- a mass-market hosted SaaS for all job seekers
- a spray-and-pray auto-application engine

Those markets are already crowded, convenience-driven, and hostile to a local-first setup.

## Highest-leverage next steps

### Product

- Rewrite the positioning around "control, evidence, and truthful tailoring"
- Narrow the persona to startup/tech applicants first
- Explicitly market supported ATS surfaces instead of implying universal coverage

### Validation

- Watch 10 real users apply to real jobs with the product
- Measure time saved from job URL to review-ready application
- Track unresolved fields per ATS and per site
- Compare interview conversion for assisted vs non-assisted applications

### Scope discipline

- Keep final submit manual
- Go deeper on supported ATS before going broader
- Make review surfaces dramatically better before adding more autonomous behavior

## Scorecard

- Product clarity: 8/10
- Engineering completeness for MVP scope: 8/10
- Demand evidence: 3/10
- Broad startup defensibility: 4/10
- Niche/open-source potential: 8/10

## Bottom line

This project is not obviously a breakout "AI applies to jobs for everyone" startup.

It **is** a credible and differentiated project if reframed as the safest, most transparent way to go from job URL to review-ready application package for serious candidates.
