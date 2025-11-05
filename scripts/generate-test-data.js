#!/usr/bin/env node

/**
 * Generate test data: 10 CEOs and 10 CTOs with profiles, summaries, and embeddings
 * Some pairs are designed to be good matches
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// CEO profiles - designed to have good matches with CTOs
const ceoProfiles = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@test.founderfinder.com",
    location: "San Francisco, CA",
    timezone: "PST",
    availability: "Full-time",
    commitment: "Equity-focused, looking for technical cofounder",
    seniority: "Serial entrepreneur",
    startup: {
      stage: "Pre-seed",
      domain: "SaaS - Productivity Tools",
      description: "Building an AI-powered project management platform for remote teams. Targeting SMBs with 50-500 employees.",
      funding: "Bootstrapped, seeking $500K seed round",
      equity_offer: "15-25%",
      salary_offer: "$120K-150K"
    },
    interview: {
      structured: {
        experience: "10+ years in product management, 2 previous startups",
        goals: "Build a scalable SaaS product, exit in 5-7 years",
        workStyle: "Data-driven, collaborative, hands-on",
        priorities: "Product-market fit, user acquisition, technical excellence"
      },
      freeText: "I've built and sold two B2B SaaS companies. I understand product deeply but need a technical cofounder who can architect a scalable system. Looking for someone passionate about productivity tools and remote work."
    }
  },
  {
    name: "Marcus Johnson",
    email: "marcus.j@test.founderfinder.com",
    location: "New York, NY",
    timezone: "EST",
    availability: "Full-time",
    commitment: "Equity + competitive salary",
    seniority: "First-time founder",
    startup: {
      stage: "Idea stage",
      domain: "AI/ML - Healthcare",
      description: "Developing AI diagnostic tools for early disease detection using medical imaging. Focus on accessibility in developing countries.",
      funding: "Seeking $1M seed round",
      equity_offer: "20-30%",
      salary_offer: "$100K-130K"
    },
    interview: {
      structured: {
        experience: "5 years in healthcare consulting, MBA from Wharton",
        goals: "Impact-focused, build a sustainable healthcare company",
        workStyle: "Mission-driven, analytical, patient",
        priorities: "Regulatory compliance, clinical validation, ethical AI"
      },
      freeText: "I'm passionate about using AI to improve healthcare outcomes globally. Need a technical cofounder with ML/AI expertise, especially in computer vision. Must be committed to ethical AI and healthcare regulations."
    }
  },
  {
    name: "Emily Rodriguez",
    email: "emily.r@test.founderfinder.com",
    location: "Austin, TX",
    timezone: "CST",
    availability: "Full-time",
    commitment: "Equity-focused",
    seniority: "Experienced executive",
    startup: {
      stage: "MVP stage",
      domain: "FinTech - Payments",
      description: "Building a B2B payment platform for freelancers and agencies. Focus on instant payments and fee transparency.",
      funding: "Raised $250K friends & family",
      equity_offer: "15-20%",
      salary_offer: "$90K-120K"
    },
    interview: {
      structured: {
        experience: "8 years at Stripe, PayPal, leading payments products",
        goals: "Build the next-generation payment infrastructure",
        workStyle: "Fast-paced, execution-focused, customer-obsessed",
        priorities: "Security, compliance, user experience"
      },
      freeText: "I've spent my career in payments and fintech. I understand the regulatory landscape and customer needs. Looking for a technical cofounder who can build secure, scalable payment infrastructure."
    }
  },
  {
    name: "David Kim",
    email: "david.kim@test.founderfinder.com",
    location: "Seattle, WA",
    timezone: "PST",
    availability: "Full-time",
    commitment: "Equity + salary",
    seniority: "Second-time founder",
    startup: {
      stage: "Pre-seed",
      domain: "E-commerce - Marketplace",
      description: "Creating a marketplace for sustainable and ethical products. Connecting conscious consumers with verified eco-friendly brands.",
      funding: "Bootstrapped, seeking $750K seed",
      equity_offer: "18-25%",
      salary_offer: "$110K-140K"
    },
    interview: {
      structured: {
        experience: "12 years in e-commerce, sold previous company to Amazon",
        goals: "Build a purpose-driven business with sustainable growth",
        workStyle: "Values-driven, transparent, collaborative",
        priorities: "Supply chain integrity, user trust, platform scalability"
      },
      freeText: "I sold my last e-commerce startup and want to build something meaningful. Need a technical cofounder who shares my values and can build a scalable marketplace platform."
    }
  },
  {
    name: "Jessica Park",
    email: "jessica.p@test.founderfinder.com",
    location: "Boston, MA",
    timezone: "EST",
    availability: "Full-time",
    commitment: "Equity-focused",
    seniority: "First-time founder",
    startup: {
      stage: "Idea stage",
      domain: "EdTech - Learning Platform",
      description: "Building an AI-powered personalized learning platform for K-12 students. Adaptive curriculum based on learning styles.",
      funding: "Seeking $600K seed round",
      equity_offer: "20-30%",
      salary_offer: "$95K-125K"
    },
    interview: {
      structured: {
        experience: "7 years as teacher and curriculum developer, EdTech consultant",
        goals: "Improve educational outcomes through personalized learning",
        workStyle: "Patient, research-driven, student-focused",
        priorities: "Pedagogical effectiveness, user engagement, data privacy"
      },
      freeText: "I'm an educator turned entrepreneur. I understand learning science but need a technical cofounder who can build adaptive AI systems and engaging learning experiences."
    }
  },
  {
    name: "Alex Thompson",
    email: "alex.t@test.founderfinder.com",
    location: "Los Angeles, CA",
    timezone: "PST",
    availability: "Full-time",
    commitment: "Equity + salary",
    seniority: "Experienced executive",
    startup: {
      stage: "Pre-seed",
      domain: "Gaming - Mobile",
      description: "Creating a mobile gaming platform focused on social and casual games. Emphasis on community and monetization.",
      funding: "Raised $300K angel round",
      equity_offer: "15-22%",
      salary_offer: "$100K-130K"
    },
    interview: {
      structured: {
        experience: "10 years in gaming industry, Zynga, EA",
        goals: "Build a profitable gaming company with strong community",
        workStyle: "Creative, data-driven, user-focused",
        priorities: "User retention, monetization, platform performance"
      },
      freeText: "I've shipped multiple successful mobile games. I understand game design and monetization but need a technical cofounder who can build scalable game infrastructure and real-time multiplayer systems."
    }
  },
  {
    name: "Michael Chen",
    email: "michael.c@test.founderfinder.com",
    location: "Chicago, IL",
    timezone: "CST",
    availability: "Full-time",
    commitment: "Equity-focused",
    seniority: "Serial entrepreneur",
    startup: {
      stage: "MVP stage",
      domain: "PropTech - Real Estate",
      description: "Building a platform for property management automation. AI-powered maintenance scheduling and tenant communication.",
      funding: "Bootstrapped, seeking $500K seed",
      equity_offer: "18-25%",
      salary_offer: "$105K-135K"
    },
    interview: {
      structured: {
        experience: "15 years in real estate, 3 previous startups",
        goals: "Modernize property management industry",
        workStyle: "Practical, efficiency-focused, customer-oriented",
        priorities: "Operational efficiency, user adoption, regulatory compliance"
      },
      freeText: "I've been in real estate my entire career. I understand the industry pain points but need a technical cofounder to build the automation and AI systems."
    }
  },
  {
    name: "Rachel Green",
    email: "rachel.g@test.founderfinder.com",
    location: "Denver, CO",
    timezone: "MST",
    availability: "Full-time",
    commitment: "Equity + salary",
    seniority: "First-time founder",
    startup: {
      stage: "Idea stage",
      domain: "FoodTech - Delivery",
      description: "Building a platform connecting local restaurants with sustainable food delivery. Focus on reducing waste and supporting local businesses.",
      funding: "Seeking $800K seed round",
      equity_offer: "20-28%",
      salary_offer: "$90K-120K"
    },
    interview: {
      structured: {
        experience: "6 years in food service, restaurant operations",
        goals: "Build a sustainable food delivery business",
        workStyle: "Community-focused, environmentally conscious, detail-oriented",
        priorities: "Sustainability, local partnerships, operational efficiency"
      },
      freeText: "I'm passionate about food and sustainability. I understand restaurant operations but need a technical cofounder to build the delivery platform and logistics system."
    }
  },
  {
    name: "James Wilson",
    email: "james.w@test.founderfinder.com",
    location: "Miami, FL",
    timezone: "EST",
    availability: "Full-time",
    commitment: "Equity-focused",
    seniority: "Second-time founder",
    startup: {
      stage: "Pre-seed",
      domain: "TravelTech - Booking Platform",
      description: "Creating an AI-powered travel booking platform with personalized recommendations. Focus on sustainable travel options.",
      funding: "Raised $200K friends & family",
      equity_offer: "15-20%",
      salary_offer: "$95K-125K"
    },
    interview: {
      structured: {
        experience: "9 years at Expedia, Booking.com, travel industry expert",
        goals: "Build the next-generation travel platform",
        workStyle: "Customer-centric, data-driven, fast-moving",
        priorities: "Personalization, user experience, supplier relationships"
      },
      freeText: "I've worked at major travel companies and understand the industry. Need a technical cofounder who can build recommendation engines and scalable booking systems."
    }
  },
  {
    name: "Lisa Anderson",
    email: "lisa.a@test.founderfinder.com",
    location: "Portland, OR",
    timezone: "PST",
    availability: "Full-time",
    commitment: "Equity + salary",
    seniority: "Experienced executive",
    startup: {
      stage: "MVP stage",
      domain: "HRTech - Recruitment",
      description: "Building an AI-powered recruitment platform that reduces bias and improves candidate matching. Focus on diversity and inclusion.",
      funding: "Bootstrapped, seeking $600K seed",
      equity_offer: "18-25%",
      salary_offer: "$110K-140K"
    },
    interview: {
      structured: {
        experience: "11 years in HR and recruiting, built teams at Google, Meta",
        goals: "Transform recruitment with AI and reduce hiring bias",
        workStyle: "Inclusive, ethical, results-oriented",
        priorities: "Fairness, accuracy, user experience"
      },
      freeText: "I've spent over a decade in HR and recruiting. I understand the hiring process and bias issues. Need a technical cofounder who can build ethical AI systems for recruitment."
    }
  }
];

// CTO profiles - designed to match with CEOs above
const ctoProfiles = [
  {
    name: "Ryan Singh",
    email: "ryan.s@test.founderfinder.com",
    location: "San Francisco, CA",
    timezone: "PST",
    availability: "Full-time",
    commitment: "Equity-focused, looking for business cofounder",
    seniority: "Senior engineer",
    techBackground: {
      primary_stack: "Full-stack: TypeScript, React, Node.js, PostgreSQL",
      years_experience: 8,
      domains: "SaaS, productivity tools, B2B platforms",
      track_record: "Led engineering at 2 startups, scaled systems to 1M+ users",
      founding_interest: "Passionate about remote work and productivity. Want to build something that helps teams collaborate better."
    },
    interview: {
      structured: {
        experience: "8 years full-stack, 2 startups, led teams of 10+",
        skills: "Architecture, scalability, system design, team leadership",
        goals: "Build a scalable SaaS product, grow as technical leader",
        workStyle: "Product-focused, collaborative, quality-oriented"
      },
      freeText: "I've built scalable SaaS platforms from scratch. I love architecting systems and leading technical teams. Looking for a business cofounder who understands product and customers."
    }
  },
  {
    name: "Priya Patel",
    email: "priya.p@test.founderfinder.com",
    location: "New York, NY",
    timezone: "EST",
    availability: "Full-time",
    commitment: "Equity + competitive salary",
    seniority: "Principal engineer",
    techBackground: {
      primary_stack: "ML/AI: Python, TensorFlow, PyTorch, Computer Vision",
      years_experience: 10,
      domains: "Healthcare AI, medical imaging, computer vision",
      track_record: "Published researcher, 5+ years in healthcare ML, FDA-approved products",
      founding_interest: "Want to use AI to improve healthcare outcomes. Especially interested in medical imaging and diagnostics."
    },
    interview: {
      structured: {
        experience: "10 years ML/AI, PhD in Computer Science, healthcare focus",
        skills: "Deep learning, computer vision, medical imaging, regulatory compliance",
        goals: "Build impactful healthcare AI products",
        workStyle: "Research-driven, ethical, detail-oriented"
      },
      freeText: "I'm a ML researcher turned engineer. I've built FDA-approved medical imaging systems. Looking for a business cofounder who understands healthcare and can navigate regulations."
    }
  },
  {
    name: "Carlos Mendez",
    email: "carlos.m@test.founderfinder.com",
    location: "Austin, TX",
    timezone: "CST",
    availability: "Full-time",
    commitment: "Equity-focused",
    seniority: "Senior engineer",
    techBackground: {
      primary_stack: "Backend: Go, Rust, PostgreSQL, AWS, payment systems",
      years_experience: 9,
      domains: "FinTech, payments, financial infrastructure",
      track_record: "Built payment systems processing $1B+ annually, PCI compliance expert",
      founding_interest: "Passionate about financial infrastructure. Want to build secure, compliant payment systems."
    },
    interview: {
      structured: {
        experience: "9 years in fintech, payment systems, security expert",
        skills: "Payment infrastructure, security, compliance, scalability",
        goals: "Build next-generation payment infrastructure",
        workStyle: "Security-first, compliance-focused, high-reliability"
      },
      freeText: "I've built payment systems that handle billions in transactions. I understand security, compliance, and scalability. Looking for a business cofounder who understands payments and fintech."
    }
  },
  {
    name: "Amit Kumar",
    email: "amit.k@test.founderfinder.com",
    location: "Seattle, WA",
    timezone: "PST",
    availability: "Full-time",
    commitment: "Equity + salary",
    seniority: "Staff engineer",
    techBackground: {
      primary_stack: "Full-stack: Java, React, Node.js, microservices, AWS",
      years_experience: 12,
      domains: "E-commerce, marketplaces, scalable platforms",
      track_record: "Built marketplace platforms at Amazon, scaled to millions of users",
      founding_interest: "Interested in sustainable e-commerce and marketplace platforms. Want to build something meaningful."
    },
    interview: {
      structured: {
        experience: "12 years at Amazon, built marketplace infrastructure",
        skills: "Marketplace architecture, scalability, search, recommendations",
        goals: "Build a purpose-driven marketplace",
        workStyle: "Scalability-focused, customer-obsessed, values-driven"
      },
      freeText: "I've built marketplace platforms at scale. I understand e-commerce infrastructure and scalability. Looking for a business cofounder who shares my values."
    }
  },
  {
    name: "Sofia Martinez",
    email: "sofia.m@test.founderfinder.com",
    location: "Boston, MA",
    timezone: "EST",
    availability: "Full-time",
    commitment: "Equity-focused",
    seniority: "Senior engineer",
    techBackground: {
      primary_stack: "Full-stack: Python, React, ML, educational platforms",
      years_experience: 7,
      domains: "EdTech, learning platforms, adaptive systems",
      track_record: "Built learning platforms used by 500K+ students, ML for personalization",
      founding_interest: "Passionate about education. Want to use AI to personalize learning and improve outcomes."
    },
    interview: {
      structured: {
        experience: "7 years in EdTech, ML for education, adaptive learning",
        skills: "Learning platforms, ML personalization, user engagement",
        goals: "Improve educational outcomes through technology",
        workStyle: "Student-focused, research-driven, impact-oriented"
      },
      freeText: "I've built educational platforms and ML systems for personalized learning. I understand learning science and technology. Looking for a business cofounder who understands education."
    }
  },
  {
    name: "Kevin Zhang",
    email: "kevin.z@test.founderfinder.com",
    location: "Los Angeles, CA",
    timezone: "PST",
    availability: "Full-time",
    commitment: "Equity + salary",
    seniority: "Principal engineer",
    techBackground: {
      primary_stack: "Game engine: C++, Unity, Unreal, real-time systems, multiplayer",
      years_experience: 11,
      domains: "Gaming, mobile games, real-time multiplayer",
      track_record: "Shipped 10+ mobile games, built game engines, real-time systems",
      founding_interest: "Love building games and game infrastructure. Want to create engaging gaming experiences."
    },
    interview: {
      structured: {
        experience: "11 years in gaming, mobile games, real-time systems",
        skills: "Game engines, multiplayer, performance optimization, monetization",
        goals: "Build profitable gaming platforms",
        workStyle: "Performance-focused, creative, user-engaged"
      },
      freeText: "I've built game engines and shipped multiple successful games. I understand game technology and infrastructure. Looking for a business cofounder who understands gaming."
    }
  },
  {
    name: "Nina Lee",
    email: "nina.l@test.founderfinder.com",
    location: "Chicago, IL",
    timezone: "CST",
    availability: "Full-time",
    commitment: "Equity-focused",
    seniority: "Senior engineer",
    techBackground: {
      primary_stack: "Full-stack: Python, React, IoT, automation systems",
      years_experience: 8,
      domains: "PropTech, real estate tech, automation",
      track_record: "Built IoT and automation systems, property management platforms",
      founding_interest: "Interested in modernizing real estate with technology. Want to build automation systems."
    },
    interview: {
      structured: {
        experience: "8 years in PropTech, IoT, automation systems",
        skills: "IoT, automation, property management systems, integrations",
        goals: "Modernize property management",
        workStyle: "Efficiency-focused, practical, customer-oriented"
      },
      freeText: "I've built IoT and automation systems for real estate. I understand property management technology. Looking for a business cofounder who understands real estate."
    }
  },
  {
    name: "Daniel Kim",
    email: "daniel.k@test.founderfinder.com",
    location: "Denver, CO",
    timezone: "MST",
    availability: "Full-time",
    commitment: "Equity + salary",
    seniority: "Staff engineer",
    techBackground: {
      primary_stack: "Backend: Node.js, Python, logistics, delivery systems",
      years_experience: 9,
      domains: "FoodTech, delivery, logistics, supply chain",
      track_record: "Built delivery systems at DoorDash, logistics optimization",
      founding_interest: "Interested in sustainable food delivery. Want to build logistics systems that reduce waste."
    },
    interview: {
      structured: {
        experience: "9 years in food delivery, logistics, supply chain",
        skills: "Logistics, route optimization, delivery systems, sustainability",
        goals: "Build sustainable food delivery",
        workStyle: "Efficiency-focused, environmentally conscious, community-oriented"
      },
      freeText: "I've built delivery and logistics systems at scale. I understand food delivery technology and logistics. Looking for a business cofounder who shares my values."
    }
  },
  {
    name: "Emma Wilson",
    email: "emma.w@test.founderfinder.com",
    location: "Miami, FL",
    timezone: "EST",
    availability: "Full-time",
    commitment: "Equity-focused",
    seniority: "Senior engineer",
    techBackground: {
      primary_stack: "Full-stack: Python, React, ML, recommendation systems",
      years_experience: 8,
      domains: "TravelTech, booking platforms, recommendations",
      track_record: "Built recommendation engines, booking platforms, personalization",
      founding_interest: "Interested in travel technology. Want to build personalized booking experiences."
    },
    interview: {
      structured: {
        experience: "8 years in travel tech, recommendations, booking systems",
        skills: "Recommendation engines, personalization, booking systems, ML",
        goals: "Build next-generation travel platform",
        workStyle: "Customer-centric, data-driven, personalization-focused"
      },
      freeText: "I've built recommendation engines and booking platforms. I understand travel technology and personalization. Looking for a business cofounder who understands travel."
    }
  },
  {
    name: "Tom Brown",
    email: "tom.b@test.founderfinder.com",
    location: "Portland, OR",
    timezone: "PST",
    availability: "Full-time",
    commitment: "Equity + salary",
    seniority: "Principal engineer",
    techBackground: {
      primary_stack: "Full-stack: Python, React, ML/AI, ethical AI systems",
      years_experience: 10,
      domains: "HRTech, recruitment, AI, bias reduction",
      track_record: "Built AI recruitment systems, bias reduction research, published papers",
      founding_interest: "Passionate about using AI ethically in hiring. Want to reduce bias and improve matching."
    },
    interview: {
      structured: {
        experience: "10 years in HRTech, AI recruitment, bias reduction",
        skills: "AI systems, fairness, bias reduction, recruitment platforms",
        goals: "Transform recruitment with ethical AI",
        workStyle: "Ethical, research-driven, fairness-focused"
      },
      freeText: "I've built AI recruitment systems and researched bias reduction. I understand ethical AI and hiring. Looking for a business cofounder who shares my values."
    }
  }
];

function generateSummary(role, profile) {
  // Generate a summary from the profile data
  const isCEO = role === "CEO";
  const name = profile.name;
  const experience = isCEO 
    ? `${profile.interview.structured.experience}. ${profile.startup.description}`
    : `${profile.interview.structured.experience}. ${profile.techBackground.track_record}`;
  const goals = profile.interview.structured.goals;
  const workStyle = profile.interview.structured.workStyle;
  
  return `${name} is an experienced ${role} with ${experience}. Their goal is to ${goals}. They work in a ${workStyle} style and are looking for a complementary cofounder. ${profile.interview.freeText || ""}`;
}

function generateMockEmbedding(text, seed) {
  // Generate a deterministic mock embedding based on text hash
  // This creates a 1536-dimensional vector (OpenAI embedding size)
  const hash = simpleHash(text + seed);
  const embedding = new Float32Array(1536);
  for (let i = 0; i < 1536; i++) {
    // Create pseudo-random but deterministic values
    const val = Math.sin(hash + i) * 0.5 + 0.5;
    embedding[i] = val;
  }
  return Buffer.from(new Uint8Array(embedding.buffer));
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

async function createUser(profile, role, isCEO) {
  console.log(`Creating ${role}: ${profile.name} (${profile.email})`);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      email: profile.email,
      name: profile.name,
      role: role,
      onboarded: true,
      emailVerified: new Date(),
    }
  });

  // Create profile
  await prisma.profile.create({
    data: {
      userId: user.id,
      name: profile.name,
      location: profile.location,
      timezone: profile.timezone,
      availability: profile.availability,
      commitment: profile.commitment,
      seniority: profile.seniority,
    }
  });

  // Create role-specific data
  if (isCEO) {
    await prisma.startup.create({
      data: {
        userId: user.id,
        ...profile.startup,
      }
    });
  } else {
    await prisma.techBackground.create({
      data: {
        userId: user.id,
        ...profile.techBackground,
      }
    });
  }

  // Create interview response
  await prisma.interviewResponse.create({
    data: {
      userId: user.id,
      role: role,
      structured: profile.interview.structured,
      freeText: profile.interview.freeText,
    }
  });

  // Generate summary (without API call)
  const summaryText = generateSummary(role, profile);
  await prisma.profileSummary.create({
    data: {
      userId: user.id,
      ai_summary_text: summaryText,
    }
  });

  // Generate mock embedding (deterministic based on text)
  const embedding = generateMockEmbedding(summaryText, user.id);
  await prisma.embedding.create({
    data: {
      userId: user.id,
      role: role,
      source: "summary",
      vector: embedding,
    }
  });

  console.log(`✅ Created ${role}: ${profile.name}`);
  return user;
}

async function main() {
  console.log("🚀 Starting test data generation...\n");

  try {
    // Delete existing test users first
    console.log("Cleaning up existing test data...\n");
    const testEmails = [
      ...ceoProfiles.map(p => p.email),
      ...ctoProfiles.map(p => p.email)
    ];
    
    for (const email of testEmails) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        // Delete related data (cascade should handle most, but be explicit)
        await prisma.embedding.deleteMany({ where: { userId: existing.id } });
        await prisma.profileSummary.deleteMany({ where: { userId: existing.id } });
        await prisma.interviewResponse.deleteMany({ where: { userId: existing.id } });
        await prisma.techBackground.deleteMany({ where: { userId: existing.id } });
        await prisma.startup.deleteMany({ where: { userId: existing.id } });
        await prisma.profile.deleteMany({ where: { userId: existing.id } });
        await prisma.user.delete({ where: { id: existing.id } });
        console.log(`  Deleted existing user: ${email}`);
      }
    }

    console.log("\n✅ Cleanup complete\n");

    // Create CEOs
    console.log("Creating CEOs...\n");
    for (const ceoProfile of ceoProfiles) {
      await createUser(ceoProfile, "CEO", true);
    }

    console.log("\n✅ Created 10 CEOs\n");

    // Create CTOs
    console.log("Creating CTOs...\n");
    for (const ctoProfile of ctoProfiles) {
      await createUser(ctoProfile, "CTO", false);
    }

    console.log("\n✅ Created 10 CTOs");
    console.log("\n🎉 Test data generation complete!");
    console.log("\nGood matches to expect:");
    console.log("  - Sarah Chen (SaaS CEO) ↔ Ryan Singh (Full-stack CTO)");
    console.log("  - Marcus Johnson (Healthcare AI CEO) ↔ Priya Patel (ML/AI CTO)");
    console.log("  - Emily Rodriguez (FinTech CEO) ↔ Carlos Mendez (Payment systems CTO)");
    console.log("  - David Kim (E-commerce CEO) ↔ Amit Kumar (Marketplace CTO)");
    console.log("  - Jessica Park (EdTech CEO) ↔ Sofia Martinez (EdTech CTO)");

  } catch (error) {
    console.error("❌ Error generating test data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
