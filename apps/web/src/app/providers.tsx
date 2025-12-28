"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { AuthResponse } from "../lib/types";
import {
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
} from "../lib/api";
import type { LoginPayload, RegisterPayload } from "../lib/types";

type Theme = "dark" | "light";
type Locale = "en" | "am";

const THEME_KEY = "tutorstartup.theme";
const LOCALE_KEY = "tutorstartup.locale";

// Note: auth tokens are intentionally NOT persisted in localStorage.

type Dictionary = Record<string, string>;

const DICTS: Record<Locale, Dictionary> = {
  en: {
    "nav.home": "Home",
    "nav.search": "Find tutors",
    "nav.findWork": "Find work",
    "nav.savedJobs": "Saved jobs",
    "nav.proposals": "Proposals",
    "nav.contracts": "Contracts",
    "nav.postJob": "Post a job",
    "nav.myJobs": "My jobs",
    "nav.jobs": "Jobs",
    "nav.profile": "Tutor profile",
    "nav.requests": "Requests",
    "nav.login": "Login",
    "nav.register": "Register",
    "nav.logout": "Log out",

    "home.title": "Find the right tutor, fast.",
    "home.subtitle":
      "Search tutors, review profiles, and message to start a lesson.",
    "home.cta.search": "Search tutors",
    "home.cta.tutor": "I’m a tutor",

    "home.hero.preview.title": "Popular right now",
    "home.hero.preview.tags.1": "IB Physics HL",
    "home.hero.preview.tags.2": "SAT Critical Reading",
    "home.hero.preview.tags.3": "Grade 5 Literacy",
    "home.hero.preview.tags.4": "University Calculus",
    "home.hero.preview.card.title": "Live tutor requests",
    "home.hero.preview.card.body":
      "Families near Bole are booking math and science blocks right now.",
    "home.hero.preview.card.status": "Updated moments ago",

    "home.value.title": "Why it works",
    "home.value.1.title": "Fast search",
    "home.value.1.body": "Find tutors by subject and location.",
    "home.value.2.title": "Real profiles",
    "home.value.2.body": "Clear bios, rates, and skills at a glance.",
    "home.value.3.title": "Built for scale",
    "home.value.3.body": "Production-ready API + workers under the hood.",

    "home.partners.kicker": "TRUSTED BY",
    "home.partners.title": "Schools and learning communities across Ethiopia",
    "home.partners.1": "Horizon Academy",
    "home.partners.2": "Addis Scholars",
    "home.partners.3": "Blue Nile STEM",
    "home.partners.4": "Future Minds",

    "home.stats.1.value": "2.1K+",
    "home.stats.1.label": "Active students",
    "home.stats.2.value": "840+",
    "home.stats.2.label": "Verified tutors",
    "home.stats.3.value": "4.9/5",
    "home.stats.3.label": "Avg. satisfaction",

    "home.paths.student.kicker": "FOR STUDENTS",
    "home.paths.student.title": "Find a tutor",
    "home.paths.student.body": "Browse tutors and filter by what you need.",
    "home.paths.student.cta": "Search tutors",
    "home.paths.student.ctaSecondary": "Log in",

    "home.paths.tutor.kicker": "FOR TUTORS",
    "home.paths.tutor.title": "Create your profile",
    "home.paths.tutor.body": "Add subjects, languages, rate, and location.",
    "home.paths.tutor.ctaPrimary": "Register",
    "home.paths.tutor.ctaSecondary": "Go to profile",

    "home.how.title": "How it works",
    "home.how.subtitle": "A simple flow from search to lesson.",
    "home.how.1.kicker": "STEP 1",
    "home.how.1.title": "Search",
    "home.how.1.body": "Filter by keyword, subjects, and location.",
    "home.how.2.kicker": "STEP 2",
    "home.how.2.title": "Review",
    "home.how.2.body": "Compare profiles, subjects, and rates.",
    "home.how.3.kicker": "STEP 3",
    "home.how.3.title": "Start",
    "home.how.3.body": "Pick a tutor and begin your learning journey.",

    "home.reasons.students.title": "Why students love us",
    "home.reasons.students.body":
      "Personalized matching, rapid responses, and measurable progress dashboards.",
    "home.reasons.students.items.1.title": "Matching intelligence",
    "home.reasons.students.items.1.body":
      "Signals from goals, schedule, and learning style inform every suggestion.",
    "home.reasons.students.items.2.title": "Real-time updates",
    "home.reasons.students.items.2.body":
      "Families get weekly milestone summaries that keep everyone aligned.",
    "home.reasons.students.items.3.title": "Safe messaging",
    "home.reasons.students.items.3.body":
      "Secure chat with file sharing keeps planning in one place.",

    "home.reasons.tutors.title": "Why tutors stay",
    "home.reasons.tutors.body":
      "Consistent demand, fast payouts, and tooling built for professional educators.",
    "home.reasons.tutors.items.1.title": "Qualified leads",
    "home.reasons.tutors.items.1.body":
      "Requests include subject, budget, and prerequisites so you focus on teaching.",
    "home.reasons.tutors.items.2.title": "Smart scheduling",
    "home.reasons.tutors.items.2.body":
      "Sync calendars, set travel radius, and auto-block commute buffers.",
    "home.reasons.tutors.items.3.title": "Performance analytics",
    "home.reasons.tutors.items.3.body":
      "Session ratings and retention dashboards help showcase your impact.",

    "home.metrics.kicker": "RESULTS",
    "home.metrics.title": "Proven outcomes for every journey",
    "home.metrics.subtitle":
      "We combine curated talent with transparent data so decisions feel confident.",

    "home.testimonials.1.quote":
      "Every tutor we hired through Tutorstartup had lesson plans ready by day one.",
    "home.testimonials.1.author": "Miskaye H.",
    "home.testimonials.1.role": "Academic Director, Addis Academy",
    "home.testimonials.2.quote":
      "It finally feels easy to showcase my expertise and connect with the right families.",
    "home.testimonials.2.author": "Samuel G.",
    "home.testimonials.2.role": "STEM Tutor",

    "home.cta.banner.kicker": "NEXT COHORT",
    "home.cta.banner.title": "Launch your tutoring journey this week",
    "home.cta.banner.body":
      "Create a profile, get discovered, and start teaching within days.",
    "home.cta.banner.primary": "Join as tutor",
    "home.cta.banner.secondary": "Find tutors",

    "home.cta.schools.kicker": "FOR SCHOOLS",
    "home.cta.schools.title": "Need a vetted tutor bench for the new term?",
    "home.cta.schools.body":
      "Our partnerships team curates subject-specific pods for schools and learning pods across Addis.",
    "home.cta.schools.primary": "Talk to partnerships",
    "home.cta.schools.secondary": "Download overview",

    "home.curriculum.kicker": "CURRICULUM PATHWAYS",
    "home.curriculum.title": "Honors-level expertise, local context",
    "home.curriculum.body":
      "From national exams to IB diplomas, tutors bring classroom experience plus culturally-aware coaching.",
    "home.curriculum.1.title": "National Exams",
    "home.curriculum.1.body":
      "Grade 8 & 12 prep with timed drills and rubric-based feedback.",
    "home.curriculum.2.title": "International Programs",
    "home.curriculum.2.body":
      "IB, AP, and SAT specialists simplify complex syllabi.",
    "home.curriculum.3.title": "STEM Labs",
    "home.curriculum.3.body": "Hands-on math, robotics, and coding intensives.",
    "home.curriculum.4.title": "Languages & Writing",
    "home.curriculum.4.body":
      "Academic writing, IELTS, and Amharic literacy mentors.",

    "home.faq.title": "Questions, answered",
    "home.faq.subtitle":
      "Still unsure? Here’s what families and tutors ask first.",
    "home.faq.1.q": "How fast can we match with a tutor?",
    "home.faq.1.a":
      "Most families receive curated matches within 24 hours once goals and schedule are submitted.",
    "home.faq.2.q": "What vetting do tutors go through?",
    "home.faq.2.a":
      "Identity, credentials, reference checks, and a recorded demo lesson before profiles go live.",
    "home.faq.3.q": "Do you support in-person and remote lessons?",
    "home.faq.3.a":
      "Yes. Tutors set travel zones and virtual availability so you can choose what works best.",

    "home.footer.copy": "Built in Addis · Tutorstartup",
    "home.footer.links.search": "Search tutors",
    "home.footer.links.profile": "Tutor profile",
    "home.footer.links.login": "Login",
    "home.footer.contact": "Contact",
    "home.footer.email": "hello@tutorstartup.com",
    "home.footer.phone": "+251 11 000 0000",
    "home.footer.support": "Support center",
    "home.footer.privacy": "Privacy",
    "home.footer.terms": "Terms",

    "auth.login.title": "Welcome back",
    "auth.login.subtitle": "Sign in to continue.",
    "auth.login.footer": "No account?",
    "auth.login.footer.link": "Register",
    "auth.register.title": "Create your account",
    "auth.register.subtitle": "Join as a student or a tutor.",
    "auth.register.footer": "Already have an account?",
    "auth.register.footer.link": "Login",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Full name",
    "auth.role": "Role",
    "auth.role.student": "Student",
    "auth.role.parent": "Parent",
    "auth.role.tutor": "Tutor",
    "auth.submit.login": "Sign in",
    "auth.submit.register": "Create account",
    "auth.login.submit": "Sign in",
    "auth.register.submit": "Create account",
    "auth.logout.title": "Signing you out",
    "auth.logout.subtitle": "Ending your session…",

    "tutor.profile.title": "Tutor profile",
    "tutor.profile.subtitle":
      "Update your profile — changes will be indexed for search.",
    "tutor.profile.bio": "Bio",
    "tutor.profile.subjects": "Subjects (comma separated)",
    "tutor.profile.languages": "Languages (comma separated)",
    "tutor.profile.hourlyRate": "Hourly rate",
    "tutor.profile.location": "Location",
    "tutor.profile.save": "Save profile",

    "profile.title": "Tutor profile",
    "profile.subtitle":
      "Update your profile — changes will be indexed for search.",
    "profile.bio": "Bio",
    "profile.subjects": "Subjects (comma separated)",
    "profile.languages": "Languages (comma separated)",
    "profile.hourlyRate": "Hourly rate",
    "profile.location": "Location",
    "profile.save": "Save profile",
    "profile.saved": "Saved. Sync queued.",
    "profile.lastUpdated": "Last updated",
    "profile.guard.login": "Please log in to edit your tutor profile.",
    "profile.guard.tutorOnly": "This page is for tutors only.",
    "profile.guard.cta.login": "Login",
    "profile.guard.cta.search": "Search tutors",

    "search.title": "Tutor search",
    "search.subtitle": "Filter by keyword, subject, and location.",
    "search.keywords": "Keywords",
    "search.keyword": "Keywords",
    "search.subjects": "Subjects (comma separated)",
    "search.location": "Location",
    "search.limit": "Limit",
    "search.page": "Page",
    "search.submit": "Search",
    "search.results": "Results",
    "search.empty": "Run a search to see matching tutors.",
    "search.noResults": "No tutors match this filter set yet.",
    "search.remote": "Remote",
    "search.customRate": "Custom rate",
    "search.noBio": "No bio yet",
    "search.meta.disabled": "Search driver disabled",
    "search.meta.cache": "Served from cache",
    "search.meta.live": "Live search hit",

    "tutor.detail.title": "Tutor",
    "tutor.detail.kicker": "TUTOR PROFILE",
    "tutor.detail.back": "Back to search",
    "tutor.detail.about": "About",
    "tutor.detail.noBio": "No bio yet",
    "tutor.detail.subjects": "Subjects",
    "tutor.detail.languages": "Languages",
    "tutor.detail.rate": "Hourly rate",

    "lesson.request.title": "Request a lesson",
    "lesson.request.subtitle": "Send a short note to get started.",
    "lesson.request.subject": "Subject",
    "lesson.request.message": "Message",
    "lesson.request.submit": "Send request",
    "lesson.sent": "Request sent. The tutor will respond soon.",
    "lesson.guard.login": "Please log in or register to contact this tutor.",
    "lesson.guard.studentParentOnly":
      "Only students or parents can request lessons.",
    "lesson.guard.cta.login": "Login",
    "lesson.guard.cta.register": "Register",

    "requests.title": "Lesson requests",
    "requests.subtitle": "Review and respond to new lesson requests.",
    "requests.back": "Back to profile",
    "requests.empty": "No lesson requests yet.",
    "requests.from": "From",
    "requests.accept": "Accept",
    "requests.decline": "Decline",
    "requests.guard.login": "Please log in to view lesson requests.",
    "requests.guard.tutorOnly": "This page is for tutors only.",

    "state.loading": "Loading…",
    "common.loading": "Loading…",
    "state.loginRequired": "Login required",
    "state.tutorOnly": "This page is for tutors.",
  },
  am: {
    "nav.home": "መነሻ",
    "nav.search": "አስተማሪ ፈልግ",
    "nav.findWork": "ስራ ፈልግ",
    "nav.savedJobs": "የተቀመጡ ስራዎች",
    "nav.proposals": "ማመልከቻዎች",
    "nav.contracts": "ኮንትራቶች",
    "nav.postJob": "ስራ ለጥፍ",
    "nav.myJobs": "የእኔ ስራዎች",
    "nav.jobs": "ስራዎች",
    "nav.profile": "የአስተማሪ ፕሮፋይል",
    "nav.requests": "ጥያቄዎች",
    "nav.login": "ግባ",
    "nav.register": "መመዝገብ",
    "nav.logout": "ውጣ",

    "home.title": "ትክክለኛውን አስተማሪ በፍጥነት ያግኙ።",
    "home.subtitle": "አስተማሪ ፈልጉ፣ ፕሮፋይሎችን ይመልከቱ እና መልዕክት ይላኩ።",
    "home.cta.search": "አስተማሪ ፈልግ",
    "home.cta.tutor": "እኔ አስተማሪ ነኝ",

    "home.hero.preview.title": "በአሁን ጊዜ የሚፈለጉ",
    "home.hero.preview.tags.1": "IB ፊዚክስ HL",
    "home.hero.preview.tags.2": "SAT ንባብ",
    "home.hero.preview.tags.3": "የ5ኛ ክፍል ንባብ",
    "home.hero.preview.tags.4": "ዩኒቨርሲቲ ካልኩለስ",
    "home.hero.preview.card.title": "በቀጥታ የሚጠየቁ ፍለጋዎች",
    "home.hero.preview.card.body":
      "በቦሌ አካባቢ ያሉ ቤተሰቦች ሂሳብ እና ሳይንስ ክፍሎችን በአሁኑ ጊዜ እየተያዙ ነው።",
    "home.hero.preview.card.status": "በቅርብ ጊዜ ታድቧል",

    "home.value.title": "ለምን ይሰራል",
    "home.value.1.title": "ፈጣን ፍለጋ",
    "home.value.1.body": "በርዕስ እና በአካባቢ አስተማሪዎችን ያግኙ።",
    "home.value.2.title": "ግልጽ ፕሮፋይሎች",
    "home.value.2.body": "ማብራሪያ፣ ክፍያ እና ክህሎት በቀላሉ ይታያል።",
    "home.value.3.title": "ለመጠን የተዘጋጀ",
    "home.value.3.body": "በውስጥ የተዘጋጀ ጠንካራ API እና ወርከር።",

    "home.partners.kicker": "የታመኑ ተቋማት",
    "home.partners.title": "በኢትዮጵያ ያሉ ትምህርት ቤቶች እና መማሪያ ማህበሮች",
    "home.partners.1": "Horizon Academy",
    "home.partners.2": "Addis Scholars",
    "home.partners.3": "Blue Nile STEM",
    "home.partners.4": "Future Minds",

    "home.stats.1.value": "2.1K+",
    "home.stats.1.label": "ንቁ ተማሪዎች",
    "home.stats.2.value": "840+",
    "home.stats.2.label": "የተረጋገጡ አስተማሪዎች",
    "home.stats.3.value": "4.9/5",
    "home.stats.3.label": "የደህንነት እሴት",

    "home.paths.student.kicker": "ለተማሪዎች",
    "home.paths.student.title": "አስተማሪ ፈልግ",
    "home.paths.student.body": "በሚፈልጉት ርዕስ እና አካባቢ ያጣሩ።",
    "home.paths.student.cta": "አስተማሪ ፈልግ",
    "home.paths.student.ctaSecondary": "ግባ",

    "home.paths.tutor.kicker": "ለአስተማሪዎች",
    "home.paths.tutor.title": "ፕሮፋይል ፍጠር",
    "home.paths.tutor.body": "ርዕሶች፣ ቋንቋዎች፣ ክፍያ እና አካባቢ ያስገቡ።",
    "home.paths.tutor.ctaPrimary": "መመዝገብ",
    "home.paths.tutor.ctaSecondary": "ወደ ፕሮፋይል",

    "home.how.title": "እንዴት ይሰራል",
    "home.how.subtitle": "ከፍለጋ እስከ ትምህርት ቀላል መንገድ።",
    "home.how.1.kicker": "ደረጃ 1",
    "home.how.1.title": "ፈልግ",
    "home.how.1.body": "በቁልፍ ቃላት፣ ርዕሶች እና አካባቢ ያጣሩ።",
    "home.how.2.kicker": "ደረጃ 2",
    "home.how.2.title": "አወዳድር",
    "home.how.2.body": "ፕሮፋይሎችን፣ ርዕሶችን እና ክፍያዎችን ያነፃፅሩ።",
    "home.how.3.kicker": "ደረጃ 3",
    "home.how.3.title": "ጀምር",
    "home.how.3.body": "አስተማሪ ይምረጡ እና ትምህርት መጀመር።",

    "home.reasons.students.title": "ተማሪዎች ለምን ይወዳሉ",
    "home.reasons.students.body": "የግል ማስተካከያ፣ ፈጣን ምላሽ እና የስኬት መዝገቦች ያገናኛሉ።",
    "home.reasons.students.items.1.title": "ብልህ ግንኙነት",
    "home.reasons.students.items.1.body":
      "ግቦች፣ ሰሌዳ እና የመማር ቅርጸ ተከላይ መረጃ ላይ ይመሠረታል።",
    "home.reasons.students.items.2.title": "በቀጥታ ሪፖርት",
    "home.reasons.students.items.2.body":
      "ቤተሰቦች ሁሉም በአንድ ገጽ ላይ የሳምንት ሪፖርት ይቀበላሉ።",
    "home.reasons.students.items.3.title": "ደህንነታዊ መልዕክት",
    "home.reasons.students.items.3.body": "የፋይል ማካፈል ያለው ደህንነታዊ መልዕክት ማዕከል።",

    "home.reasons.tutors.title": "አስተማሪዎች ለምን ይቆያሉ",
    "home.reasons.tutors.body": "ተስፋ ያላቸው ጥያቄዎች፣ ፈጣን ክፍያ እና የሙያ መሣሪያዎች።",
    "home.reasons.tutors.items.1.title": "ዝርዝር ጥያቄዎች",
    "home.reasons.tutors.items.1.body": "ርዕስ፣ በጀት እና ቅድመ ሁኔታ ጋር ይመጣሉ።",
    "home.reasons.tutors.items.2.title": "ብልህ መርሐግብር",
    "home.reasons.tutors.items.2.body": "ቀን መያዣ ይቃረናሉ፣ የጉዞ ጊዜ በራሱ ይጨምራል።",
    "home.reasons.tutors.items.3.title": "የአፈጻጸም ትንታኔ",
    "home.reasons.tutors.items.3.body": "የክፍለ ጊዜ እና የተማሪ ግብዣ ሪፖርቶች እውቅና ይጨምራሉ።",

    "home.metrics.kicker": "ውጤቶች",
    "home.metrics.title": "ለእያንዳንዱ እድገት የተረጋገጠ ውጤት",
    "home.metrics.subtitle": "ተዘጋጀ ችሎታ እና ግልጽ ውሂብ በስራ ላይ ነው።",

    "home.testimonials.1.quote":
      "በTutorstartup ያገኘናቸው አስተማሪዎች በመጀመሪያ ቀን ትምህርት ዝግጅት ነበራቸው።",
    "home.testimonials.1.author": "ሚስቃዬ ሀ.",
    "home.testimonials.1.role": "የስልጠና ዳይሬክተር",
    "home.testimonials.2.quote": "ክህሎቴን ማሳየት እና ተገቢ ቤተሰቦችን ማግኘት ቀላል ሆኗል።",
    "home.testimonials.2.author": "ሳሙኤል ገ.",
    "home.testimonials.2.role": "የSTEM አስተማሪ",

    "home.cta.banner.kicker": "ቀጣይ ሙከራ",
    "home.cta.banner.title": "የእርስዎን የአስተማሪ ጉዞ ዛሬ ይጀምሩ",
    "home.cta.banner.body": "ፕሮፋይል ፍጠሩ፣ ይታወቁ እና በጥቂት ቀን ውስጥ ይዘጋጁ።",
    "home.cta.banner.primary": "እንደ አስተማሪ ተቀላቀል",
    "home.cta.banner.secondary": "አስተማሪ ፈልግ",

    "home.cta.schools.kicker": "ለትምህርት ቤቶች",
    "home.cta.schools.title": "ለአዲሱ ዓመት የተመረጡ አስተማሪዎች ይፈልጋሉ?",
    "home.cta.schools.body":
      "የእኛ ቡድን በአዲስ እና በአካባቢዎ የተለያዩ ርዕሶችን የሚሸፍኑ ሙዚቃዊ ቡድኖችን ያዘጋጃል።",
    "home.cta.schools.primary": "ከቅርብ ቡድን ይነጋገሩ",
    "home.cta.schools.secondary": "መግለጫ ያውርዱ",

    "home.curriculum.kicker": "የስርዓተ ትምህርት መንገዶች",
    "home.curriculum.title": "የከፍተኛ ደረጃ ሙያ በአካባቢ እውቀት",
    "home.curriculum.body":
      "ከብሔራዊ ፈተና እስከ IB ዲፕሎማ፣ አስተማሪዎች ተሞክሮ እና ባህላዊ ግንዛቤ ይያዙ።",
    "home.curriculum.1.title": "ብሔራዊ ፈተናዎች",
    "home.curriculum.1.body": "የ8ኛ እና 12ኛ ደረጃ ዝግጅት ከሙከራ የተመሠረተ ግምገማ።",
    "home.curriculum.2.title": "ዓለም አቀፍ ፕሮግራሞች",
    "home.curriculum.2.body": "IB፣ AP እና SAT ባለሙያዎች ንባብን ያቀላጥፋሉ።",
    "home.curriculum.3.title": "STEM ላቦራቶሪዎች",
    "home.curriculum.3.body": "ማስተላለፊያ ሂሳብ፣ ሮቦቲክስ እና ኮዲንግ ክለቦች።",
    "home.curriculum.4.title": "ቋንቋ እና ጽሑፍ",
    "home.curriculum.4.body": "የጽሁፍ እና የአማርኛ ንባብ መምህራን።",

    "home.faq.title": "ጥያቄዎች",
    "home.faq.subtitle": "ገና እያሰቡ ነው? የተደጋጋሚ ጥያቄዎች እዚህ ናቸው።",
    "home.faq.1.q": "በምን ጊዜ አስተማሪ እንደምንገኝ?",
    "home.faq.1.a": "ግቦችን እና ሰሌዳን ካስገቡ በኋላ በ24 ሰዓታት ውስጥ የተመረጡ ግንኙነቶችን እንልካለን።",
    "home.faq.2.q": "አስተማሪዎችን እንዴት ትፈትሻላችሁ?",
    "home.faq.2.a": "መታወቂያ፣ ማስረጃዎች፣ ማስረጃ ቁጥር እና ቪዲዮ ትምህርት በፊት ይደረጋል።",
    "home.faq.3.q": "በቀጥታ እና ከርቀት ትምህርት ትደግፋላችሁ?",
    "home.faq.3.a": "አዎን። አስተማሪዎች የጉዞ እና የመስመር ሰዓት ይዘረጋሉ ስለዚህ ምርጫ ይቀርባል።",

    "home.footer.copy": "በአዲስ የተገነባ · Tutorstartup",
    "home.footer.links.search": "አስተማሪ ፈልግ",
    "home.footer.links.profile": "የአስተማሪ ፕሮፋይል",
    "home.footer.links.login": "ግባ",
    "home.footer.contact": "እውቂያ",
    "home.footer.email": "hello@tutorstartup.com",
    "home.footer.phone": "+251 11 000 0000",
    "home.footer.support": "የድጋፍ ማዕከል",
    "home.footer.privacy": "ግላዊነት",
    "home.footer.terms": "ውሎች",

    "auth.login.title": "እንኳን ተመለሱ",
    "auth.login.subtitle": "ለመቀጠል ይግቡ።",
    "auth.login.footer": "መለያ የለዎትም?",
    "auth.login.footer.link": "መመዝገብ",
    "auth.register.title": "መለያ ፍጠር",
    "auth.register.subtitle": "እንደ ተማሪ ወይም እንደ አስተማሪ ይቀላቀሉ።",
    "auth.register.footer": "ቀድሞ መለያ አለዎት?",
    "auth.register.footer.link": "ግባ",
    "auth.email": "ኢሜይል",
    "auth.password": "የይለፍ ቃል",
    "auth.name": "ሙሉ ስም",
    "auth.role": "ሚና",
    "auth.role.student": "ተማሪ",
    "auth.role.tutor": "አስተማሪ",
    "auth.submit.login": "ግባ",
    "auth.submit.register": "መለያ ፍጠር",
    "auth.login.submit": "ግባ",
    "auth.register.submit": "መለያ ፍጠር",
    "auth.logout.title": "በመውጣት ላይ",
    "auth.logout.subtitle": "ሴሽንዎን በመዝጋት ላይ…",

    "tutor.profile.title": "የአስተማሪ ፕሮፋይል",
    "tutor.profile.subtitle": "ፕሮፋይልዎን ያዘምኑ — ለፍለጋ ይመዘገባል።",
    "tutor.profile.bio": "ማብራሪያ",
    "tutor.profile.subjects": "ርዕሶች (በኮማ ለይተው)",
    "tutor.profile.languages": "ቋንቋዎች (በኮማ ለይተው)",
    "tutor.profile.hourlyRate": "የሰዓት ክፍያ",
    "tutor.profile.location": "አካባቢ",
    "tutor.profile.save": "ፕሮፋይል አስቀምጥ",

    "profile.title": "የአስተማሪ ፕሮፋይል",
    "profile.subtitle": "ፕሮፋይልዎን ያዘምኑ — ለፍለጋ ይመዘገባል።",
    "profile.bio": "ማብራሪያ",
    "profile.subjects": "ርዕሶች (በኮማ ለይተው)",
    "profile.languages": "ቋንቋዎች (በኮማ ለይተው)",
    "profile.hourlyRate": "የሰዓት ክፍያ",
    "profile.location": "አካባቢ",
    "profile.save": "ፕሮፋይል አስቀምጥ",
    "profile.saved": "ተቀምጧል። ለፍለጋ ማስተካከያ ተላክ።",
    "profile.lastUpdated": "መጨረሻ ማዘመን",
    "profile.guard.login": "የአስተማሪ ፕሮፋይልዎን ለማስተካከል መጀመሪያ ይግቡ።",
    "profile.guard.tutorOnly": "ይህ ገጽ ለአስተማሪዎች ብቻ ነው።",
    "profile.guard.cta.login": "ግባ",
    "profile.guard.cta.search": "አስተማሪ ፈልግ",

    "search.title": "የአስተማሪ ፍለጋ",
    "search.subtitle": "በቁልፍ ቃላት፣ ርዕሶች እና አካባቢ ያጣሩ።",
    "search.keywords": "ቁልፍ ቃላት",
    "search.keyword": "ቁልፍ ቃላት",
    "search.subjects": "ርዕሶች (በኮማ ለይተው)",
    "search.location": "አካባቢ",
    "search.limit": "መጠን",
    "search.page": "ገጽ",
    "search.submit": "ፈልግ",
    "search.results": "ውጤቶች",
    "search.empty": "ተመሳሳይ አስተማሪዎችን ለማየት ፈልጉ።",
    "search.noResults": "ከእነዚህ ማጣሪያዎች ጋር የሚመሳሰል አስተማሪ የለም።",
    "search.remote": "ርቀት",
    "search.customRate": "የተለየ ክፍያ",
    "search.noBio": "ማብራሪያ የለም",
    "search.meta.disabled": "የፍለጋ አገልግሎት ተሰናክሏል",
    "search.meta.cache": "ከካሽ ተገኝቷል",
    "search.meta.live": "ቀጥታ ፍለጋ",

    "state.loading": "በመጫን ላይ…",
    "common.loading": "በመጫን ላይ…",
    "state.loginRequired": "መጀመሪያ ግባ",
    "state.tutorOnly": "ይህ ገጽ ለአስተማሪዎች ብቻ ነው።",
  },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within Providers");
  }
  return value;
}

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used within Providers");
  }
  return value;
}

type AuthContextValue = {
  auth: AuthResponse | null;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within Providers");
  }
  return value;
}

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" ? stored : "dark";
  });
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    const stored = localStorage.getItem(LOCALE_KEY);
    return stored === "en" || stored === "am" ? stored : "en";
  });
  const [auth, setAuth] = useState<AuthResponse | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const refreshed = await refreshSession();
        setAuth(refreshed);
      } catch {
        // No active session yet.
      }
    };

    void run();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.lang = locale;
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);

  const t = useCallback(
    (key: string) => {
      return DICTS[locale][key] ?? DICTS.en[key] ?? key;
    },
    [locale]
  );

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginUser(payload);
    setAuth(response);
    return response;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await registerUser(payload);
    setAuth(response);
    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } catch {
      // If the API is unreachable, we still clear local auth state.
    } finally {
      setAuth(null);
    }
  }, []);

  const i18nValue = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  const themeValue = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  const authValue = useMemo<AuthContextValue>(
    () => ({ auth, login, register, logout }),
    [auth, login, register, logout]
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <I18nContext.Provider value={i18nValue}>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </I18nContext.Provider>
    </ThemeContext.Provider>
  );
}
