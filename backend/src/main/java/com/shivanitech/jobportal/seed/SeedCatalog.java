package com.shivanitech.jobportal.seed;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Static demo-data catalog used by {@link DemoDataSeeder}. All company names are real,
 * well-known organisations used only as employer labels for demonstration job postings;
 * every job description, responsibility, and company blurb below is original text written
 * for this project and does not reproduce any real job advertisement or corporate copy.
 */
final class SeedCatalog {

    private SeedCatalog() {
    }

    /** First category created - used to detect whether this catalog has already been seeded. */
    static final String SENTINEL_CATEGORY = "Software Development";

    static final List<String> LOCATIONS = List.of(
            "Bengaluru", "Hyderabad", "Chennai", "Pune", "Mumbai", "Delhi NCR", "Noida", "Gurugram",
            "Kolkata", "Ahmedabad", "Coimbatore", "Kochi", "Trivandrum", "Mysuru", "Visakhapatnam", "Remote"
    );

    static final List<String> BENEFITS = List.of(
            "Comprehensive health insurance for employees and dependants",
            "Provident fund and gratuity benefits",
            "Flexible working hours and hybrid work options",
            "Generous paid time off and public holidays",
            "Learning and development allowance",
            "Performance-linked annual bonus",
            "Employee wellness and assistance programs",
            "Relocation assistance for outstation candidates"
    );

    /** Index 0 = fresher, 1 = associate, 2 = senior, 3 = lead, 4 = leadership. */
    static final String[] TIER_TITLE_TEMPLATES = {
            "Graduate Trainee - %s", "%s", "Senior %s", "Lead %s", "%s Manager"
    };
    static final String[] TIER_LABELS = {"Fresher", "1-3 Years", "3-5 Years", "5-8 Years", "8-12 Years / Leadership"};
    static final int[][] TIER_EXPERIENCE = {{0, 1}, {1, 3}, {3, 5}, {5, 8}, {8, 12}};
    static final int[][] TIER_BASE_SALARY = {
            {300000, 550000}, {600000, 1100000}, {1200000, 2000000}, {2200000, 3800000}, {4000000, 7000000}
    };
    static final String[] TIER_RESPONSIBILITY_INTRO = {
            "Work closely with senior team members to learn the tools, processes, and best practices used day to day.",
            "Take ownership of well-defined tasks and contribute independently within an established team structure.",
            "Take ownership of complex problems end to end and mentor junior team members as needed.",
            "Provide technical and functional leadership on key initiatives and guide a small team toward shared goals.",
            "Define strategy and direction for the function, and lead, mentor, and grow a high-performing team."
    };

    // ---------------------------------------------------------------- domain-tag company pools
    static final Map<String, List<String>> COMPANIES_BY_TAG = new LinkedHashMap<>();
    static final Map<String, String> COMPANY_ABOUT = new LinkedHashMap<>();

    private static void tag(String tagName, String... names) {
        COMPANIES_BY_TAG.put(tagName, List.of(names));
    }

    private static void about(String name, String blurb) {
        COMPANY_ABOUT.put(name, blurb);
    }

    static {
        tag("TECH", "Google", "Microsoft", "Amazon", "Apple", "Meta", "Oracle", "IBM", "Intel", "NVIDIA",
                "Adobe", "Cisco", "Salesforce", "ServiceNow", "SAP", "Zoho", "Freshworks", "Razorpay",
                "PhonePe", "Flipkart", "Swiggy", "Zomato");
        tag("CONSULTING", "Accenture", "Deloitte", "EY", "KPMG", "PwC", "Capgemini", "Cognizant", "Infosys",
                "TCS", "Wipro", "HCLTech", "Tech Mahindra", "LTIMindtree");
        tag("BANK_FIN", "ICICI Bank", "HDFC Bank", "Axis Bank", "Kotak Mahindra Bank", "State Bank of India",
                "Bajaj Finserv", "HDFC Life", "ICICI Lombard");
        tag("MANUFACTURING_AUTO", "Tata Motors", "Ashok Leyland", "Hyundai Motor India", "Bosch", "Siemens",
                "Havells India", "Crompton Greaves", "Polycab", "Larsen & Toubro", "Continental");
        tag("TELECOM_CONGLOMERATE", "Reliance Industries", "Bharti Airtel", "Jio Platforms");
        tag("HEALTHCARE", "Apollo Hospitals", "Dr. Reddy's Laboratories", "Cipla", "Fortis Healthcare",
                "Max Healthcare", "Biocon", "Serum Institute of India", "Sun Pharma", "Piramal Pharma");
        tag("RETAIL", "Reliance Retail", "Titan Company", "Avenue Supermarts", "Shoppers Stop", "Tata CLiQ");
        tag("LOGISTICS", "Delhivery", "Blue Dart", "DTDC", "Ecom Express", "Maersk");
        tag("HOSPITALITY", "Indian Hotels Company", "Oberoi Group", "ITC Hotels", "OYO");
        tag("EDUCATION", "BYJU'S", "upGrad", "Vedantu", "Extramarks", "Manipal Academy of Higher Education");
        tag("LEGAL", "Cyril Amarchand Mangaldas", "Khaitan & Co", "AZB & Partners", "Trilegal");
        tag("CONSTRUCTION", "Larsen & Toubro", "Shapoorji Pallonji", "DLF Limited");
        tag("GAMEDEV", "Nazara Technologies", "Moonfrog Labs", "Dream11", "Zynga India");
        tag("CYBERSEC", "Quick Heal Technologies", "Palo Alto Networks", "CyberArk");

        about("Google", "A multinational technology company known for internet search, cloud computing, and consumer software, with a large engineering presence in India.");
        about("Microsoft", "A global technology company building productivity software, cloud services, and developer tools used by organisations worldwide.");
        about("Amazon", "A global e-commerce and cloud computing company operating large-scale technology, logistics, and retail platforms.");
        about("Apple", "A multinational technology company designing consumer hardware, software, and services with a strong focus on user experience.");
        about("Meta", "A technology company building social platforms and immersive technologies used by billions of people globally.");
        about("Oracle", "An enterprise technology company providing database, cloud infrastructure, and business applications to organisations worldwide.");
        about("IBM", "A global technology and consulting company with a long history in enterprise software, hybrid cloud, and AI.");
        about("Intel", "A global semiconductor company designing processors and computing technologies that power devices and data centres.");
        about("NVIDIA", "A technology company known for graphics processing units and accelerated computing platforms used in AI and gaming.");
        about("Adobe", "A software company known for creative, marketing, and document management products used by millions of professionals.");
        about("Cisco", "A global networking company providing infrastructure, security, and collaboration technology to enterprises.");
        about("Salesforce", "A cloud software company known for its customer relationship management platform used by businesses worldwide.");
        about("ServiceNow", "A cloud software company providing digital workflow platforms for IT, HR, and customer service operations.");
        about("SAP", "A global enterprise software company providing ERP and business applications used by organisations across industries.");
        about("Zoho", "An Indian software company building a suite of cloud business applications used by millions of organisations globally.");
        about("Freshworks", "An Indian-origin SaaS company building customer engagement and IT service management software.");
        about("Razorpay", "An Indian fintech company providing payment and business banking solutions for businesses of all sizes.");
        about("PhonePe", "An Indian digital payments company offering a widely used mobile payments and financial services platform.");
        about("Flipkart", "One of India's leading e-commerce platforms, serving customers across a wide range of product categories.");
        about("Swiggy", "An Indian on-demand delivery platform connecting customers with restaurants and daily essentials.");
        about("Zomato", "An Indian food-delivery and restaurant-discovery platform operating at large scale across the country.");
        about("Accenture", "A global professional services company providing consulting, technology, and outsourcing services.");
        about("Deloitte", "A global professional services firm offering audit, consulting, tax, and advisory services.");
        about("EY", "A global professional services firm providing assurance, consulting, and advisory services across industries.");
        about("KPMG", "A global professional services firm offering audit, tax, and advisory services to organisations worldwide.");
        about("PwC", "A global professional services network providing assurance, advisory, and tax services.");
        about("Capgemini", "A global technology and consulting company helping organisations modernise their technology and operations.");
        about("Cognizant", "A global IT services and consulting company serving clients across banking, healthcare, and retail.");
        about("Infosys", "An Indian multinational IT services and consulting company serving clients across the globe.");
        about("TCS", "An Indian multinational IT services company and one of the largest technology employers in the country.");
        about("Wipro", "An Indian multinational corporation providing IT, consulting, and business process services.");
        about("HCLTech", "An Indian multinational technology company providing IT services, engineering, and R&D solutions.");
        about("Tech Mahindra", "An Indian multinational technology company providing IT and business process services to global clients.");
        about("LTIMindtree", "An Indian technology consulting and digital solutions company serving enterprises worldwide.");
        about("ICICI Bank", "One of India's largest private-sector banks, offering retail and corporate banking services.");
        about("HDFC Bank", "One of India's leading private-sector banks known for its retail and digital banking services.");
        about("Axis Bank", "A leading Indian private-sector bank offering a wide range of financial products and services.");
        about("Kotak Mahindra Bank", "A prominent Indian private-sector bank offering banking and financial services.");
        about("State Bank of India", "India's largest public-sector bank, serving customers across retail and corporate banking.");
        about("Bajaj Finserv", "A leading Indian financial services company offering lending, insurance, and wealth management.");
        about("HDFC Life", "A leading Indian life insurance company offering protection and savings products.");
        about("ICICI Lombard", "A leading Indian general insurance company offering a wide range of insurance products.");
        about("Tata Motors", "One of India's largest automobile manufacturers, producing commercial and passenger vehicles.");
        about("Ashok Leyland", "A leading Indian commercial vehicle manufacturer producing trucks and buses.");
        about("Hyundai Motor India", "The Indian arm of a global automobile manufacturer producing passenger vehicles.");
        about("Bosch", "A global engineering and technology company known for automotive components and industrial technology.");
        about("Siemens", "A global technology company focused on industrial automation, infrastructure, and digitalisation.");
        about("Havells India", "A leading Indian company manufacturing electrical equipment and consumer durables.");
        about("Crompton Greaves", "A well-known Indian consumer electrical and durables manufacturing company.");
        about("Polycab", "A leading Indian manufacturer of wires, cables, and electrical products.");
        about("Larsen & Toubro", "A major Indian conglomerate engaged in engineering, construction, and technology.");
        about("Continental", "A global technology company specialising in automotive components and mobility solutions.");
        about("Reliance Industries", "One of India's largest conglomerates with operations spanning energy, retail, and telecom.");
        about("Bharti Airtel", "A leading Indian telecommunications company providing mobile, broadband, and digital services.");
        about("Jio Platforms", "An Indian technology company offering telecom, digital, and connectivity services at large scale.");
        about("Apollo Hospitals", "One of India's largest healthcare groups operating hospitals and diagnostic services nationwide.");
        about("Dr. Reddy's Laboratories", "A leading Indian pharmaceutical company manufacturing generic and branded medicines.");
        about("Cipla", "A leading Indian pharmaceutical company known for respiratory and generic medicines.");
        about("Fortis Healthcare", "A leading Indian healthcare provider operating a network of hospitals across the country.");
        about("Max Healthcare", "A prominent Indian hospital network providing multi-specialty healthcare services.");
        about("Biocon", "A leading Indian biopharmaceutical company focused on affordable biologics and research.");
        about("Serum Institute of India", "One of the world's largest vaccine manufacturers, based in India.");
        about("Sun Pharma", "India's largest pharmaceutical company, manufacturing medicines for global markets.");
        about("Piramal Pharma", "An Indian pharmaceutical company providing manufacturing and healthcare solutions globally.");
        about("Reliance Retail", "India's largest retail company, operating stores and e-commerce across categories.");
        about("Titan Company", "A leading Indian consumer products company known for watches, jewellery, and eyewear.");
        about("Avenue Supermarts", "The company behind DMart, one of India's leading value retail supermarket chains.");
        about("Shoppers Stop", "A leading Indian retail chain offering fashion, beauty, and lifestyle products.");
        about("Tata CLiQ", "An Indian omni-channel retail platform offering fashion, electronics, and luxury products.");
        about("Delhivery", "A leading Indian logistics company providing supply chain and delivery solutions.");
        about("Blue Dart", "A leading Indian express logistics and courier delivery company.");
        about("DTDC", "A well-known Indian courier and logistics services company.");
        about("Ecom Express", "An Indian logistics company specialising in e-commerce delivery solutions.");
        about("Maersk", "A global integrated logistics and shipping company operating across international trade routes.");
        about("Indian Hotels Company", "The company behind the Taj hotel brand, a leading Indian hospitality group.");
        about("Oberoi Group", "A premium Indian hospitality group operating luxury hotels and resorts.");
        about("ITC Hotels", "A leading Indian hospitality brand operating premium hotels across the country.");
        about("OYO", "An Indian hospitality technology company operating hotels and living spaces at scale.");
        about("BYJU'S", "An Indian ed-tech company providing digital learning programs for students.");
        about("upGrad", "An Indian ed-tech company offering online higher-education and upskilling programs.");
        about("Vedantu", "An Indian ed-tech company providing live online tutoring for school students.");
        about("Extramarks", "An Indian ed-tech company providing digital learning solutions for schools and students.");
        about("Manipal Academy of Higher Education", "A leading Indian institution offering higher education across disciplines.");
        about("Cyril Amarchand Mangaldas", "One of India's largest full-service law firms advising on corporate and commercial matters.");
        about("Khaitan & Co", "A leading Indian law firm providing corporate, tax, and dispute resolution services.");
        about("AZB & Partners", "A prominent Indian law firm advising on corporate, finance, and regulatory matters.");
        about("Trilegal", "A leading Indian law firm known for corporate and commercial legal advisory services.");
        about("Shapoorji Pallonji", "A major Indian conglomerate with a strong presence in construction and real estate.");
        about("DLF Limited", "One of India's largest real estate developers, known for commercial and residential projects.");
        about("Nazara Technologies", "An Indian gaming and sports media company operating across mobile gaming and esports.");
        about("Moonfrog Labs", "An Indian mobile gaming studio known for casual and casino-style games.");
        about("Dream11", "An Indian fantasy sports platform used by a large base of sports fans.");
        about("Zynga India", "The India studio of a global mobile gaming company known for popular casual games.");
        about("Quick Heal Technologies", "An Indian cybersecurity company providing antivirus and endpoint security solutions.");
        about("Palo Alto Networks", "A global cybersecurity company providing network and cloud security solutions.");
        about("CyberArk", "A global cybersecurity company specialising in identity and access security.");
    }

    static List<String> companiesForTags(List<String> tags) {
        List<String> combined = new java.util.ArrayList<>();
        for (String t : tags) {
            List<String> pool = COMPANIES_BY_TAG.get(t);
            if (pool != null) {
                for (String name : pool) {
                    if (!combined.contains(name)) {
                        combined.add(name);
                    }
                }
            }
        }
        return combined;
    }

    // ---------------------------------------------------------------- category specs
    record Cat(String name, String department, String stem0, String stem1, List<String> reqSkills,
               List<String> prefSkills, String education, List<String> responsibilities,
               List<String> qualifications, String impact, List<String> domainTags, double salaryMultiplier) {
    }

    static final List<Cat> CATEGORIES = List.of(
            new Cat("Software Development", "Engineering", "Software Engineer", "Software Development Engineer",
                    List.of("Java", "Python", "Data Structures & Algorithms", "Git", "REST APIs"),
                    List.of("Docker", "AWS", "Microservices"),
                    "Bachelor's degree in Computer Science, Information Technology, or a related field",
                    List.of("Design, build, and maintain scalable software applications and services.",
                            "Write clean, well-tested, and maintainable code following engineering best practices.",
                            "Participate in code reviews, design discussions, and sprint planning.",
                            "Debug and resolve production issues in collaboration with cross-functional teams."),
                    List.of("Strong problem-solving and analytical skills.",
                            "Solid understanding of object-oriented design and data structures.",
                            "Familiarity with Agile/Scrum development practices."),
                    "build products that are used by thousands of customers every day",
                    List.of("TECH", "CONSULTING", "BANK_FIN"), 1.0),

            new Cat("Java Development", "Engineering", "Java Developer", "Java Backend Engineer",
                    List.of("Java", "Spring Boot", "Hibernate", "SQL", "Microservices"),
                    List.of("Apache Kafka", "Docker", "Kubernetes"),
                    "Bachelor's degree in Computer Science or a related field",
                    List.of("Develop and maintain enterprise-grade Java applications using Spring Boot.",
                            "Design REST APIs and integrate with relational databases.",
                            "Optimise application performance and troubleshoot production issues.",
                            "Collaborate with QA and DevOps teams to ensure smooth releases."),
                    List.of("Strong understanding of core Java, OOP concepts, and multithreading.",
                            "Experience with the Spring ecosystem and ORM frameworks.",
                            "Exposure to unit testing frameworks such as JUnit."),
                    "strengthen mission-critical backend systems relied on by millions of users",
                    List.of("TECH", "CONSULTING", "BANK_FIN"), 1.0),

            new Cat("Full Stack Development", "Engineering", "Full Stack Developer", "Full Stack Engineer",
                    List.of("JavaScript", "React", "Node.js", "SQL", "REST APIs"),
                    List.of("TypeScript", "MongoDB", "Docker"),
                    "Bachelor's degree in Computer Science or a related field",
                    List.of("Build end-to-end features spanning frontend interfaces and backend services.",
                            "Design and consume REST APIs across the application stack.",
                            "Collaborate with designers and product managers to ship user-facing features.",
                            "Write automated tests to ensure application reliability."),
                    List.of("Comfortable working across both frontend and backend technologies.",
                            "Good understanding of database design and API integration.",
                            "Ability to work independently across the full development lifecycle."),
                    "own features end to end, from database schema to the user interface",
                    List.of("TECH", "CONSULTING"), 1.0),

            new Cat("Frontend Development", "Engineering", "Frontend Developer", "UI Engineer",
                    List.of("JavaScript", "React", "HTML5", "CSS3", "Responsive Design"),
                    List.of("TypeScript", "Next.js", "Redux"),
                    "Bachelor's degree in Computer Science, Design, or a related field",
                    List.of("Translate UI/UX designs into responsive, accessible web interfaces.",
                            "Build reusable component libraries using modern JavaScript frameworks.",
                            "Optimise application performance across browsers and devices.",
                            "Collaborate closely with designers and backend engineers."),
                    List.of("Strong command of modern JavaScript and component-based frameworks.",
                            "Eye for detail in visual design and cross-browser compatibility.",
                            "Familiarity with performance optimisation techniques."),
                    "shape the visual experience millions of users interact with daily",
                    List.of("TECH", "CONSULTING"), 1.0),

            new Cat("Backend Development", "Engineering", "Backend Developer", "Backend Engineer",
                    List.of("Node.js", "Python", "SQL", "REST APIs", "System Design"),
                    List.of("Docker", "Kubernetes", "Redis"),
                    "Bachelor's degree in Computer Science or a related field",
                    List.of("Design and implement scalable backend services and APIs.",
                            "Optimise database queries and system performance.",
                            "Ensure high availability and reliability of backend infrastructure.",
                            "Collaborate with frontend and DevOps teams on deployment pipelines."),
                    List.of("Strong understanding of server-side architecture and databases.",
                            "Experience with API design and authentication mechanisms.",
                            "Familiarity with caching and message-queue systems."),
                    "architect systems that scale to handle high transaction volumes",
                    List.of("TECH", "CONSULTING", "BANK_FIN"), 1.0),

            new Cat("Mobile Development", "Engineering", "Mobile App Developer", "Android/iOS Engineer",
                    List.of("Kotlin", "Swift", "REST APIs", "Mobile UI Design", "Git"),
                    List.of("Flutter", "React Native", "Firebase"),
                    "Bachelor's degree in Computer Science or a related field",
                    List.of("Build and maintain native or cross-platform mobile applications.",
                            "Collaborate with designers to implement pixel-perfect mobile interfaces.",
                            "Integrate mobile apps with backend REST APIs and third-party SDKs.",
                            "Monitor app performance and resolve crashes reported by users."),
                    List.of("Experience publishing apps to the Play Store and/or App Store.",
                            "Understanding of mobile UI/UX guidelines and performance constraints.",
                            "Familiarity with version control and CI/CD for mobile releases."),
                    "put a polished product directly into the hands of millions of mobile users",
                    List.of("TECH", "CONSULTING"), 1.0),

            new Cat("DevOps", "Engineering", "DevOps Engineer", "Site Reliability Engineer",
                    List.of("Docker", "Kubernetes", "CI/CD", "Linux", "AWS"),
                    List.of("Terraform", "Ansible", "Prometheus"),
                    "Bachelor's degree in Computer Science, IT, or a related field",
                    List.of("Build and maintain CI/CD pipelines for automated deployments.",
                            "Manage containerised infrastructure using Docker and Kubernetes.",
                            "Monitor system health and respond to production incidents.",
                            "Automate infrastructure provisioning using Infrastructure-as-Code tools."),
                    List.of("Strong understanding of Linux systems and cloud infrastructure.",
                            "Experience with monitoring, logging, and alerting tools.",
                            "Scripting ability in Bash, Python, or a similar language."),
                    "keep production systems running reliably around the clock",
                    List.of("TECH", "CONSULTING", "BANK_FIN"), 1.0),

            new Cat("Cloud Engineering", "Engineering", "Cloud Engineer", "Cloud Solutions Architect",
                    List.of("AWS", "Azure", "Terraform", "Networking", "Linux"),
                    List.of("Kubernetes", "GCP", "Cost Optimisation"),
                    "Bachelor's degree in Computer Science, IT, or a related field",
                    List.of("Design and implement secure, scalable cloud infrastructure.",
                            "Migrate on-premise workloads to public cloud platforms.",
                            "Optimise cloud costs and monitor resource utilisation.",
                            "Implement security best practices across cloud environments."),
                    List.of("Hands-on experience with at least one major public cloud platform.",
                            "Understanding of networking, security groups, and IAM policies.",
                            "Cloud certification (AWS/Azure/GCP) is an advantage."),
                    "design the cloud backbone that powers business-critical applications",
                    List.of("TECH", "CONSULTING", "BANK_FIN"), 1.05),

            new Cat("Data Engineering", "Data & Analytics", "Data Engineer", "Big Data Engineer",
                    List.of("Python", "SQL", "Apache Spark", "ETL", "Data Warehousing"),
                    List.of("Airflow", "Apache Kafka", "Snowflake"),
                    "Bachelor's degree in Computer Science, Engineering, or a related field",
                    List.of("Design and build robust ETL/ELT data pipelines.",
                            "Maintain data warehouses and ensure data quality and integrity.",
                            "Optimise pipelines for performance and scalability.",
                            "Collaborate with data scientists and analysts on data availability."),
                    List.of("Strong SQL skills and experience with distributed data processing.",
                            "Understanding of data modelling and warehousing concepts.",
                            "Experience with workflow orchestration tools."),
                    "build the data foundation that powers company-wide analytics and decisions",
                    List.of("TECH", "CONSULTING", "BANK_FIN"), 1.05),

            new Cat("Data Science", "Data & Analytics", "Data Scientist", "Data Science Analyst",
                    List.of("Python", "SQL", "Statistics", "Machine Learning", "Pandas"),
                    List.of("Scikit-learn", "Tableau", "A/B Testing"),
                    "Bachelor's/Master's degree in Statistics, Computer Science, or a related field",
                    List.of("Analyse large datasets to extract actionable business insights.",
                            "Build and validate predictive models to support decision-making.",
                            "Present findings to stakeholders through clear visualisations.",
                            "Collaborate with engineering teams to deploy models into production."),
                    List.of("Strong foundation in statistics and machine learning concepts.",
                            "Proficiency in Python or R for data analysis.",
                            "Ability to communicate technical findings to non-technical audiences."),
                    "turn raw data into insights that shape company strategy",
                    List.of("TECH", "CONSULTING", "BANK_FIN"), 1.05),

            new Cat("Machine Learning", "Data & Analytics", "Machine Learning Engineer", "ML Engineer",
                    List.of("Python", "Machine Learning", "TensorFlow", "SQL", "Model Deployment"),
                    List.of("PyTorch", "MLOps", "Docker"),
                    "Bachelor's/Master's degree in Computer Science, Data Science, or a related field",
                    List.of("Design, train, and evaluate machine learning models.",
                            "Deploy models into production and monitor performance drift.",
                            "Collaborate with data engineers to build reliable ML pipelines.",
                            "Research and apply state-of-the-art ML techniques to business problems."),
                    List.of("Solid understanding of ML algorithms and model evaluation techniques.",
                            "Hands-on experience with at least one deep learning framework.",
                            "Familiarity with MLOps and production deployment practices."),
                    "build intelligent systems that learn and improve from real data",
                    List.of("TECH", "CONSULTING"), 1.05),

            new Cat("Artificial Intelligence", "Data & Analytics", "AI Engineer", "AI Research Engineer",
                    List.of("Python", "Deep Learning", "NLP", "Computer Vision", "TensorFlow"),
                    List.of("PyTorch", "Transformers", "MLOps"),
                    "Master's degree in Computer Science, AI, or a related field preferred",
                    List.of("Research and prototype AI models for natural language or vision tasks.",
                            "Fine-tune and evaluate deep learning models on domain-specific data.",
                            "Collaborate with product teams to integrate AI features into applications.",
                            "Stay current with advances in the AI research landscape."),
                    List.of("Strong grasp of deep learning architectures and training techniques.",
                            "Experience with NLP or computer vision libraries.",
                            "A publication or project portfolio in AI is an advantage."),
                    "push the boundaries of what intelligent products can do",
                    List.of("TECH", "CONSULTING"), 1.1),

            new Cat("Cyber Security", "Information Security", "Cyber Security Analyst", "Security Engineer",
                    List.of("Network Security", "SIEM", "Penetration Testing", "Firewalls", "Risk Assessment"),
                    List.of("Ethical Hacking", "ISO 27001", "Cloud Security"),
                    "Bachelor's degree in Computer Science, IT, or Cyber Security",
                    List.of("Monitor networks and systems for security incidents and vulnerabilities.",
                            "Conduct vulnerability assessments and penetration testing.",
                            "Respond to and investigate security incidents.",
                            "Implement security controls and compliance frameworks."),
                    List.of("Understanding of common attack vectors and mitigation techniques.",
                            "Familiarity with SIEM tools and security frameworks.",
                            "Security certification (CEH/CISSP/Security+) is an advantage."),
                    "protect critical systems and customer data from evolving threats",
                    List.of("TECH", "CONSULTING", "BANK_FIN", "CYBERSEC"), 1.05),

            new Cat("QA / Testing", "Engineering", "QA Engineer", "Test Automation Engineer",
                    List.of("Manual Testing", "Automation Testing", "Selenium", "API Testing", "SQL"),
                    List.of("JUnit", "TestNG", "Performance Testing"),
                    "Bachelor's degree in Computer Science or a related field",
                    List.of("Design and execute test plans and test cases for new features.",
                            "Build and maintain automated test suites.",
                            "Log, track, and verify resolution of defects.",
                            "Collaborate with developers to improve product quality."),
                    List.of("Strong understanding of software testing methodologies.",
                            "Experience with at least one automation testing framework.",
                            "Attention to detail and a quality-first mindset."),
                    "ensure every release meets a high bar of quality before reaching customers",
                    List.of("TECH", "CONSULTING"), 0.95),

            new Cat("UI/UX Design", "Design", "UI/UX Designer", "Product Designer",
                    List.of("Figma", "Wireframing", "Prototyping", "User Research", "Visual Design"),
                    List.of("Adobe XD", "Sketch", "Design Systems"),
                    "Bachelor's degree in Design, HCI, or a related field",
                    List.of("Design intuitive user flows, wireframes, and high-fidelity prototypes.",
                            "Conduct user research and usability testing to validate designs.",
                            "Maintain and evolve the product's design system.",
                            "Collaborate closely with product managers and engineers."),
                    List.of("Strong portfolio demonstrating an end-to-end design process.",
                            "Proficiency in modern design and prototyping tools.",
                            "Understanding of accessibility and usability best practices."),
                    "shape products that feel simple and delightful to use",
                    List.of("TECH", "CONSULTING"), 0.95),

            new Cat("Product Management", "Product", "Product Manager", "Associate Product Manager",
                    List.of("Product Roadmapping", "Agile", "Stakeholder Management", "Market Research", "Analytics"),
                    List.of("SQL", "A/B Testing", "Wireframing"),
                    "Bachelor's degree in any discipline; MBA preferred for senior roles",
                    List.of("Define product vision, strategy, and roadmap.",
                            "Gather and prioritise requirements from customers and stakeholders.",
                            "Work closely with engineering and design to ship features.",
                            "Analyse product metrics to guide data-driven decisions."),
                    List.of("Strong analytical and communication skills.",
                            "Experience translating business needs into product requirements.",
                            "Comfortable working in fast-paced, cross-functional environments."),
                    "decide what gets built and why, directly shaping the product's success",
                    List.of("TECH", "CONSULTING"), 1.05),

            new Cat("Project Management", "Program Management", "Project Manager", "Program Manager",
                    List.of("Project Planning", "Agile/Scrum", "Risk Management", "Stakeholder Management", "MS Project"),
                    List.of("JIRA", "PMP", "Budgeting"),
                    "Bachelor's degree in any discipline; PMP/PRINCE2 certification preferred",
                    List.of("Plan, execute, and track projects to ensure on-time delivery.",
                            "Coordinate cross-functional teams and manage dependencies.",
                            "Identify risks and implement mitigation strategies.",
                            "Report project status and outcomes to leadership."),
                    List.of("Proven track record of delivering projects within scope and timeline.",
                            "Strong organisational and stakeholder management skills.",
                            "Familiarity with Agile and Waterfall methodologies."),
                    "keep complex, cross-functional initiatives on track from kickoff to delivery",
                    List.of("CONSULTING", "TECH", "MANUFACTURING_AUTO"), 1.0),

            new Cat("Business Analyst", "Business Analysis", "Business Analyst", "Senior Business Analyst",
                    List.of("Requirement Gathering", "SQL", "Business Process Modelling", "Stakeholder Management", "MS Excel"),
                    List.of("Power BI", "JIRA", "Data Analysis"),
                    "Bachelor's degree in Business, IT, or a related field",
                    List.of("Gather and document business requirements from stakeholders.",
                            "Analyse business processes and recommend improvements.",
                            "Translate requirements into functional specifications for engineering teams.",
                            "Support UAT and validate delivered solutions against requirements."),
                    List.of("Strong analytical and documentation skills.",
                            "Ability to bridge communication between business and technical teams.",
                            "Experience with process modelling and data analysis tools."),
                    "connect business needs with practical, technology-driven solutions",
                    List.of("CONSULTING", "BANK_FIN", "TECH"), 0.95),

            new Cat("Technical Support", "Customer Support", "Technical Support Engineer", "Support Specialist",
                    List.of("Troubleshooting", "Ticketing Systems", "Customer Communication", "Networking Basics", "SQL"),
                    List.of("Linux", "Remote Desktop Tools", "CRM Tools"),
                    "Bachelor's degree in IT, Computer Science, or a related field",
                    List.of("Resolve technical issues raised by customers via calls, chat, or email.",
                            "Diagnose and escalate complex issues to engineering teams.",
                            "Document solutions and maintain the internal knowledge base.",
                            "Track and meet service-level agreements (SLAs)."),
                    List.of("Strong troubleshooting and problem-solving skills.",
                            "Excellent verbal and written communication.",
                            "Patience and a customer-first attitude."),
                    "be the first point of contact that keeps customers successful",
                    List.of("TECH", "CONSULTING", "TELECOM_CONGLOMERATE"), 0.7),

            new Cat("Network Engineering", "IT Infrastructure", "Network Engineer", "Network Administrator",
                    List.of("Cisco Networking", "TCP/IP", "Routing & Switching", "Firewalls", "Network Monitoring"),
                    List.of("CCNA", "VPN", "SD-WAN"),
                    "Bachelor's degree in IT, Computer Science, or a related field",
                    List.of("Configure, maintain, and troubleshoot enterprise network infrastructure.",
                            "Monitor network performance and resolve connectivity issues.",
                            "Implement network security controls and firewall policies.",
                            "Plan and execute network upgrades and expansions."),
                    List.of("Strong understanding of networking protocols and topologies.",
                            "Hands-on experience with routers, switches, and firewalls.",
                            "CCNA or equivalent certification preferred."),
                    "keep the network backbone reliable for the entire organisation",
                    List.of("TECH", "CONSULTING", "TELECOM_CONGLOMERATE"), 0.85),

            new Cat("System Administration", "IT Infrastructure", "System Administrator", "IT Systems Engineer",
                    List.of("Windows Server", "Linux", "Active Directory", "VMware", "Backup & Recovery"),
                    List.of("PowerShell", "Cloud Infrastructure", "ITIL"),
                    "Bachelor's degree in IT or Computer Science",
                    List.of("Administer and maintain servers, virtual machines, and IT infrastructure.",
                            "Manage user accounts, permissions, and Active Directory.",
                            "Implement backup, recovery, and patching processes.",
                            "Provide advanced support for infrastructure-related issues."),
                    List.of("Solid understanding of server operating systems and virtualisation.",
                            "Experience with backup and disaster recovery practices.",
                            "Strong troubleshooting skills across hardware and software."),
                    "keep the systems every employee depends on running smoothly",
                    List.of("TECH", "CONSULTING"), 0.85),

            new Cat("Database Administration", "IT Infrastructure", "Database Administrator", "DBA - Cloud Databases",
                    List.of("SQL", "MySQL Administration", "PostgreSQL", "Backup & Recovery", "Performance Tuning"),
                    List.of("Oracle Database", "Replication", "Cloud Databases"),
                    "Bachelor's degree in Computer Science or a related field",
                    List.of("Install, configure, and maintain production databases.",
                            "Monitor database performance and optimise queries.",
                            "Implement backup, recovery, and replication strategies.",
                            "Ensure database security and access-control compliance."),
                    List.of("Strong SQL skills and understanding of database internals.",
                            "Experience with at least one major RDBMS.",
                            "Familiarity with performance tuning and indexing strategies."),
                    "keep the data layer fast, available, and safe at all times",
                    List.of("TECH", "CONSULTING", "BANK_FIN"), 0.9),

            new Cat("Embedded Systems", "Engineering", "Embedded Systems Engineer", "Firmware Engineer",
                    List.of("Embedded C", "Microcontrollers", "RTOS", "C++", "Debugging Tools"),
                    List.of("ARM Architecture", "PCB Design", "Communication Protocols"),
                    "Bachelor's degree in Electronics, Electrical, or Computer Engineering",
                    List.of("Design and develop firmware for embedded hardware platforms.",
                            "Debug hardware-software interaction issues using lab equipment.",
                            "Optimise code for memory- and power-constrained devices.",
                            "Collaborate with hardware teams on product design cycles."),
                    List.of("Strong C/C++ programming skills for embedded platforms.",
                            "Understanding of microcontroller architecture and RTOS concepts.",
                            "Experience with debugging tools such as oscilloscopes and JTAG."),
                    "bring hardware products to life at the code level",
                    List.of("MANUFACTURING_AUTO", "TECH"), 0.9),

            new Cat("IoT", "Engineering", "IoT Engineer", "IoT Solutions Developer",
                    List.of("Embedded C", "MQTT", "Sensors", "Cloud Integration", "Python"),
                    List.of("AWS IoT", "Edge Computing", "Communication Protocols"),
                    "Bachelor's degree in Electronics, Computer Science, or a related field",
                    List.of("Design and develop IoT device firmware and connectivity solutions.",
                            "Integrate sensor data with cloud platforms for analytics.",
                            "Ensure reliable and secure device-to-cloud communication.",
                            "Collaborate with product teams on connected device features."),
                    List.of("Experience with IoT communication protocols such as MQTT.",
                            "Understanding of sensor integration and edge processing.",
                            "Familiarity with at least one cloud IoT platform."),
                    "connect physical devices to intelligent, data-driven services",
                    List.of("MANUFACTURING_AUTO", "TECH"), 0.9),

            new Cat("Game Development", "Engineering", "Game Developer", "Gameplay Engineer",
                    List.of("C++", "Unity", "Game Physics", "3D Mathematics", "Git"),
                    List.of("Unreal Engine", "Multiplayer Networking", "Shader Programming"),
                    "Bachelor's degree in Computer Science, Game Design, or a related field",
                    List.of("Implement gameplay mechanics and systems using game engines.",
                            "Optimise game performance across target platforms.",
                            "Collaborate with artists and designers to bring game concepts to life.",
                            "Debug and fix gameplay and rendering issues."),
                    List.of("Strong programming skills in C++ or C#.",
                            "Experience with at least one major game engine.",
                            "Passion for games and understanding of game design principles."),
                    "build interactive experiences played by a large online audience",
                    List.of("GAMEDEV", "TECH"), 0.95),

            new Cat("ERP / SAP", "Enterprise Applications", "SAP Consultant", "ERP Functional Analyst",
                    List.of("SAP ABAP", "SAP MM", "SAP SD", "ERP Implementation", "Business Process Mapping"),
                    List.of("SAP FICO", "S/4HANA", "Requirement Gathering"),
                    "Bachelor's degree in IT, Engineering, or a related field",
                    List.of("Configure and implement SAP/ERP modules based on business requirements.",
                            "Support end-to-end ERP implementation and rollout projects.",
                            "Troubleshoot and resolve functional issues in production systems.",
                            "Train end-users on new ERP processes and workflows."),
                    List.of("Hands-on experience with at least one SAP or ERP module.",
                            "Understanding of core business processes across finance, supply chain, and sales.",
                            "SAP certification is an advantage."),
                    "streamline core business processes across a large organisation",
                    List.of("CONSULTING", "MANUFACTURING_AUTO"), 1.0),

            new Cat("Sales", "Sales", "Sales Executive", "Business Development Executive",
                    List.of("Cold Calling", "Lead Generation", "CRM Tools", "Negotiation", "Communication"),
                    List.of("Salesforce", "Client Relationship Management", "Market Research"),
                    "Bachelor's degree in any discipline",
                    List.of("Identify and pursue new business opportunities in the assigned territory.",
                            "Build and maintain strong relationships with prospective and existing clients.",
                            "Achieve monthly and quarterly sales targets.",
                            "Maintain accurate records of leads and deals in the CRM."),
                    List.of("Strong communication and interpersonal skills.",
                            "Target-driven mindset with a track record of meeting goals.",
                            "Willingness to travel for client meetings as required."),
                    "directly drive revenue growth through new client relationships",
                    List.of("TECH", "RETAIL", "TELECOM_CONGLOMERATE", "MANUFACTURING_AUTO"), 0.85),

            new Cat("Marketing", "Marketing", "Marketing Executive", "Digital Marketing Specialist",
                    List.of("Digital Marketing", "SEO", "Social Media Marketing", "Content Marketing", "Google Analytics"),
                    List.of("SEM", "Email Marketing", "Marketing Automation"),
                    "Bachelor's degree in Marketing, Business, or a related field",
                    List.of("Plan and execute digital marketing campaigns across channels.",
                            "Track and analyse campaign performance using analytics tools.",
                            "Create engaging content for social media and marketing collateral.",
                            "Collaborate with sales and design teams on go-to-market activities."),
                    List.of("Strong understanding of digital marketing channels and metrics.",
                            "Creative mindset with attention to brand consistency.",
                            "Experience with analytics and campaign management tools."),
                    "grow brand awareness and generate demand for the business",
                    List.of("TECH", "RETAIL", "EDUCATION", "HOSPITALITY"), 0.85),

            new Cat("HR", "Human Resources", "HR Executive", "HR Business Partner",
                    List.of("Recruitment", "Employee Relations", "HRIS", "Payroll Processing", "Communication"),
                    List.of("Talent Acquisition", "Performance Management", "Labour Law"),
                    "Bachelor's/Master's degree in HR, Business, or a related field",
                    List.of("Manage end-to-end recruitment and onboarding processes.",
                            "Handle employee relations, engagement, and grievance resolution.",
                            "Maintain HR records and support payroll processing.",
                            "Partner with business leaders on workforce planning."),
                    List.of("Strong interpersonal and organisational skills.",
                            "Understanding of HR processes and labour regulations.",
                            "Experience with HRIS or HR management software."),
                    "shape the employee experience across the organisation",
                    List.of("CONSULTING", "MANUFACTURING_AUTO", "BANK_FIN", "RETAIL"), 0.8),

            new Cat("Finance", "Finance", "Finance Analyst", "Financial Planning Analyst",
                    List.of("Financial Modelling", "MS Excel", "Budgeting", "Financial Reporting", "Analytical Skills"),
                    List.of("SAP FICO", "Power BI", "Variance Analysis"),
                    "Bachelor's/Master's degree in Finance, Commerce, or a related field",
                    List.of("Prepare financial models, budgets, and forecasts.",
                            "Analyse financial performance and variance against targets.",
                            "Support month-end and year-end closing activities.",
                            "Present financial insights to business stakeholders."),
                    List.of("Strong analytical and quantitative skills.",
                            "Proficiency in MS Excel and financial reporting tools.",
                            "Understanding of accounting and corporate finance principles."),
                    "provide the financial insight that guides key business decisions",
                    List.of("BANK_FIN", "CONSULTING", "MANUFACTURING_AUTO"), 0.95),

            new Cat("Accounting", "Finance", "Accountant", "Senior Accounts Executive",
                    List.of("Bookkeeping", "Tally", "GST Compliance", "Accounts Payable", "MS Excel"),
                    List.of("Auditing", "SAP FICO", "Taxation"),
                    "Bachelor's degree in Commerce, Accounting, or a related field",
                    List.of("Maintain accurate books of accounts and financial records.",
                            "Process invoices, payments, and reconciliations.",
                            "Ensure compliance with GST and other statutory requirements.",
                            "Assist with internal and external audits."),
                    List.of("Strong knowledge of accounting principles and practices.",
                            "Hands-on experience with accounting software such as Tally.",
                            "Attention to detail and accuracy in financial record-keeping."),
                    "keep the organisation's finances accurate and compliant",
                    List.of("BANK_FIN", "CONSULTING", "MANUFACTURING_AUTO"), 0.75),

            new Cat("Operations", "Operations", "Operations Executive", "Operations Manager",
                    List.of("Process Improvement", "MS Excel", "Vendor Management", "Coordination", "Reporting"),
                    List.of("Six Sigma", "ERP Systems", "Data Analysis"),
                    "Bachelor's degree in Business, Operations, or a related field",
                    List.of("Oversee day-to-day operational activities to ensure smooth execution.",
                            "Identify process inefficiencies and drive improvement initiatives.",
                            "Coordinate with vendors, teams, and stakeholders.",
                            "Prepare operational reports and dashboards for management."),
                    List.of("Strong organisational and coordination skills.",
                            "Ability to manage multiple priorities in a fast-paced environment.",
                            "Experience with process improvement methodologies is a plus."),
                    "keep daily operations running smoothly at scale",
                    List.of("RETAIL", "LOGISTICS", "MANUFACTURING_AUTO"), 0.8),

            new Cat("Customer Success", "Customer Success", "Customer Success Manager", "Customer Success Associate",
                    List.of("Account Management", "Customer Onboarding", "CRM Tools", "Communication", "Problem Solving"),
                    List.of("Upselling", "Data Analysis", "Salesforce"),
                    "Bachelor's degree in any discipline",
                    List.of("Onboard new customers and ensure successful product adoption.",
                            "Build long-term relationships to drive customer retention and growth.",
                            "Monitor customer health metrics and proactively address risks.",
                            "Collaborate with sales and product teams on customer feedback."),
                    List.of("Strong relationship-building and communication skills.",
                            "Customer-first mindset with a proactive approach.",
                            "Experience with CRM or customer success platforms."),
                    "ensure customers realise ongoing value from the product",
                    List.of("TECH", "CONSULTING"), 0.85),

            new Cat("Customer Support", "Customer Support", "Customer Support Executive", "Customer Care Associate",
                    List.of("Customer Communication", "Ticketing Systems", "CRM Tools", "Problem Solving", "Patience"),
                    List.of("Multilingual Communication", "Zendesk", "Upselling"),
                    "Bachelor's degree in any discipline",
                    List.of("Respond to customer queries via phone, chat, and email.",
                            "Resolve complaints and escalate unresolved issues appropriately.",
                            "Maintain accurate records of customer interactions.",
                            "Meet quality and response-time targets consistently."),
                    List.of("Excellent verbal and written communication skills.",
                            "Patience and empathy when handling customer concerns.",
                            "Ability to multitask in a fast-paced support environment."),
                    "be the friendly, reliable voice customers rely on",
                    List.of("TECH", "TELECOM_CONGLOMERATE", "RETAIL"), 0.65),

            new Cat("Supply Chain", "Supply Chain", "Supply Chain Analyst", "Supply Chain Executive",
                    List.of("Supply Chain Planning", "Inventory Management", "MS Excel", "Vendor Coordination", "Data Analysis"),
                    List.of("SAP MM", "Demand Forecasting", "ERP Systems"),
                    "Bachelor's degree in Supply Chain, Business, or Engineering",
                    List.of("Monitor inventory levels and coordinate replenishment planning.",
                            "Analyse supply chain data to identify bottlenecks and opportunities.",
                            "Coordinate with suppliers and logistics partners on delivery schedules.",
                            "Support demand forecasting and planning cycles."),
                    List.of("Strong analytical skills and attention to detail.",
                            "Understanding of supply chain and inventory management principles.",
                            "Experience with ERP or supply chain planning tools."),
                    "keep products moving efficiently from source to shelf",
                    List.of("MANUFACTURING_AUTO", "LOGISTICS", "RETAIL"), 0.8),

            new Cat("Procurement", "Procurement", "Procurement Executive", "Procurement Manager",
                    List.of("Vendor Management", "Contract Negotiation", "Purchase Order Management", "MS Excel", "Cost Analysis"),
                    List.of("SAP MM", "RFQ Management", "Category Management"),
                    "Bachelor's degree in Business, Supply Chain, or a related field",
                    List.of("Source and negotiate contracts with vendors and suppliers.",
                            "Manage purchase orders and track delivery timelines.",
                            "Evaluate supplier performance and cost-effectiveness.",
                            "Ensure procurement compliance with company policies."),
                    List.of("Strong negotiation and vendor management skills.",
                            "Understanding of procurement processes and cost analysis.",
                            "Experience with ERP-based procurement systems is a plus."),
                    "secure the best value from every supplier relationship",
                    List.of("MANUFACTURING_AUTO", "LOGISTICS"), 0.85),

            new Cat("Manufacturing", "Manufacturing", "Production Engineer", "Manufacturing Engineer",
                    List.of("Production Planning", "Quality Control", "Lean Manufacturing", "Six Sigma", "Process Improvement"),
                    List.of("SAP PP", "Root Cause Analysis", "Safety Standards"),
                    "Bachelor's degree in Mechanical, Industrial, or Production Engineering",
                    List.of("Oversee daily production operations to meet output and quality targets.",
                            "Identify and eliminate process inefficiencies on the shop floor.",
                            "Ensure compliance with safety and quality standards.",
                            "Coordinate with maintenance and quality teams to minimise downtime."),
                    List.of("Strong understanding of manufacturing and production processes.",
                            "Familiarity with lean manufacturing and quality tools.",
                            "Ability to work effectively on the shop floor."),
                    "keep production lines efficient, safe, and on schedule",
                    List.of("MANUFACTURING_AUTO"), 0.85),

            new Cat("Mechanical Engineering", "Engineering", "Mechanical Design Engineer", "Mechanical Engineer",
                    List.of("AutoCAD", "SolidWorks", "GD&T", "Product Design", "Mechanical Drawings"),
                    List.of("CATIA", "FEA Analysis", "Manufacturing Processes"),
                    "Bachelor's degree in Mechanical Engineering",
                    List.of("Design and develop mechanical components and assemblies.",
                            "Create detailed engineering drawings and specifications.",
                            "Conduct design validation and testing of prototypes.",
                            "Collaborate with manufacturing teams on design-for-production."),
                    List.of("Proficiency in CAD software for mechanical design.",
                            "Strong understanding of mechanical design principles and GD&T.",
                            "Analytical approach to problem-solving in product design."),
                    "design mechanical products used across a wide range of industries",
                    List.of("MANUFACTURING_AUTO", "CONSTRUCTION"), 0.75),

            new Cat("Civil Engineering", "Engineering", "Civil Engineer", "Site Engineer",
                    List.of("AutoCAD", "STAAD Pro", "Civil Estimation", "Structural Analysis", "Site Supervision"),
                    List.of("Project Scheduling", "Quantity Surveying", "Safety Compliance"),
                    "Bachelor's degree in Civil Engineering",
                    List.of("Prepare structural designs and construction drawings.",
                            "Supervise on-site construction activities and quality standards.",
                            "Estimate material and cost requirements for projects.",
                            "Coordinate with architects, contractors, and project managers."),
                    List.of("Strong understanding of structural design and construction methods.",
                            "Proficiency in civil engineering design software.",
                            "Ability to manage on-site execution and safety compliance."),
                    "bring large-scale infrastructure and construction projects to life",
                    List.of("CONSTRUCTION"), 0.75),

            new Cat("Electrical Engineering", "Engineering", "Electrical Engineer", "Electrical Design Engineer",
                    List.of("Electrical Circuit Design", "Power Systems", "AutoCAD Electrical", "Panel Design", "Safety Standards"),
                    List.of("PLC Programming", "SCADA", "Load Calculations"),
                    "Bachelor's degree in Electrical Engineering",
                    List.of("Design electrical systems and control panels for projects.",
                            "Prepare electrical schematics and load calculations.",
                            "Ensure compliance with electrical safety codes and standards.",
                            "Support installation, testing, and commissioning of electrical systems."),
                    List.of("Strong understanding of electrical design principles and standards.",
                            "Proficiency in electrical CAD tools.",
                            "Familiarity with power distribution and control systems."),
                    "design the electrical systems that power modern infrastructure",
                    List.of("MANUFACTURING_AUTO", "CONSTRUCTION"), 0.75),

            new Cat("Electronics Engineering", "Engineering", "Electronics Engineer", "Hardware Design Engineer",
                    List.of("PCB Design", "Circuit Design", "Embedded C", "Testing & Debugging", "Schematic Capture"),
                    List.of("Altium Designer", "Signal Processing", "Communication Protocols"),
                    "Bachelor's degree in Electronics or Electrical Engineering",
                    List.of("Design and test electronic circuits and PCB layouts.",
                            "Debug hardware issues using lab and test equipment.",
                            "Collaborate with firmware teams on hardware-software integration.",
                            "Support product certification and compliance testing."),
                    List.of("Strong understanding of analog and digital circuit design.",
                            "Experience with PCB design and simulation tools.",
                            "Hands-on skills with lab equipment for testing and debugging."),
                    "engineer the hardware at the core of connected products",
                    List.of("MANUFACTURING_AUTO", "TECH"), 0.8),

            new Cat("Automobile Engineering", "Engineering", "Automotive Design Engineer", "Vehicle Systems Engineer",
                    List.of("CATIA", "Vehicle Dynamics", "Automotive Design", "GD&T", "Product Testing"),
                    List.of("SolidWorks", "ANSYS", "Manufacturing Processes"),
                    "Bachelor's degree in Automobile or Mechanical Engineering",
                    List.of("Design and validate automotive components and systems.",
                            "Conduct performance and durability testing of vehicle parts.",
                            "Collaborate with manufacturing teams on production feasibility.",
                            "Support continuous improvement of vehicle design processes."),
                    List.of("Strong understanding of automotive design and testing standards.",
                            "Proficiency in CAD/CAE tools used in automotive engineering.",
                            "Familiarity with vehicle systems and manufacturing constraints."),
                    "design the vehicles that move millions of people every day",
                    List.of("MANUFACTURING_AUTO"), 0.8),

            new Cat("Healthcare", "Healthcare", "Staff Nurse", "Healthcare Coordinator",
                    List.of("Patient Care", "Clinical Documentation", "Nursing Procedures", "Communication", "Emergency Response"),
                    List.of("Electronic Health Records", "Medical Coding", "Infection Control"),
                    "Bachelor's degree in Nursing (BSc Nursing) or a relevant medical qualification",
                    List.of("Provide quality patient care in accordance with clinical protocols.",
                            "Maintain accurate patient records and clinical documentation.",
                            "Coordinate with doctors and healthcare teams on patient treatment plans.",
                            "Ensure compliance with hospital safety and hygiene standards."),
                    List.of("Valid nursing/medical registration as applicable.",
                            "Strong clinical knowledge and patient-care orientation.",
                            "Ability to work effectively under pressure in a healthcare setting."),
                    "directly improve patient outcomes and quality of care",
                    List.of("HEALTHCARE"), 0.85),

            new Cat("Pharmacy", "Healthcare", "Pharmacist", "Clinical Pharmacy Associate",
                    List.of("Pharmacology", "Drug Dispensing", "Regulatory Compliance", "Inventory Management", "Patient Counselling"),
                    List.of("Clinical Research", "GMP", "Drug Safety Monitoring"),
                    "Bachelor's/Master's degree in Pharmacy (B.Pharm/M.Pharm)",
                    List.of("Dispense medications accurately in line with prescriptions.",
                            "Counsel patients on proper medication use and safety.",
                            "Maintain pharmacy inventory and ensure regulatory compliance.",
                            "Collaborate with clinical staff on medication management."),
                    List.of("Valid pharmacy registration/license as required.",
                            "Strong knowledge of pharmacology and drug interactions.",
                            "Attention to detail and commitment to patient safety."),
                    "ensure patients receive safe and effective medication therapy",
                    List.of("HEALTHCARE"), 0.8),

            new Cat("Biotechnology", "Research & Development", "Research Associate - Biotechnology", "R&D Scientist",
                    List.of("Lab Techniques", "Molecular Biology", "Data Analysis", "GMP", "Research Documentation"),
                    List.of("Drug Discovery", "Bioinformatics", "Clinical Trials"),
                    "Master's/PhD in Biotechnology, Life Sciences, or a related field",
                    List.of("Conduct laboratory experiments following research protocols.",
                            "Analyse and document experimental data and outcomes.",
                            "Support drug discovery or product development research initiatives.",
                            "Ensure compliance with lab safety and quality standards."),
                    List.of("Strong laboratory and analytical skills.",
                            "Sound understanding of biotechnology or life sciences principles.",
                            "Ability to document and communicate research findings clearly."),
                    "contribute to research that advances healthcare and life sciences",
                    List.of("HEALTHCARE"), 0.85),

            new Cat("Education", "Academics", "Subject Matter Expert - Academics", "Curriculum Developer",
                    List.of("Curriculum Design", "Subject Expertise", "Content Development", "Communication", "Assessment Design"),
                    List.of("E-learning Tools", "Instructional Design", "LMS Platforms"),
                    "Bachelor's/Master's degree in the relevant subject area or Education",
                    List.of("Design curriculum and learning content for students.",
                            "Develop assessments to measure learning outcomes.",
                            "Collaborate with academic teams to improve teaching methodologies.",
                            "Review and update content to align with evolving standards."),
                    List.of("Strong subject-matter expertise and communication skills.",
                            "Experience in curriculum or content development.",
                            "Passion for education and student learning outcomes."),
                    "shape learning experiences for thousands of students",
                    List.of("EDUCATION"), 0.6),

            new Cat("Hospitality", "Hospitality", "Guest Relations Executive", "Hotel Operations Associate",
                    List.of("Guest Relations", "Front Office Management", "Communication", "Hospitality Operations", "MS Office"),
                    List.of("Reservation Systems", "Multilingual Communication", "Event Coordination"),
                    "Bachelor's degree in Hotel Management or a related field",
                    List.of("Deliver excellent guest experiences across all touchpoints.",
                            "Manage front-office operations including check-in and check-out.",
                            "Handle guest queries, requests, and complaints professionally.",
                            "Coordinate with housekeeping and F&B teams for seamless service."),
                    List.of("Excellent interpersonal and communication skills.",
                            "Presentable, guest-focused, and service-oriented attitude.",
                            "Ability to work flexible shifts including weekends."),
                    "create memorable experiences for every guest who walks in",
                    List.of("HOSPITALITY"), 0.55),

            new Cat("Logistics", "Logistics", "Logistics Executive", "Logistics Coordinator",
                    List.of("Logistics Coordination", "Warehouse Management", "Route Planning", "MS Excel", "Vendor Coordination"),
                    List.of("WMS Software", "Fleet Management", "Freight Negotiation"),
                    "Bachelor's degree in Logistics, Supply Chain, or Business",
                    List.of("Coordinate end-to-end logistics operations for timely deliveries.",
                            "Track shipments and resolve delays or exceptions.",
                            "Manage warehouse operations and inventory accuracy.",
                            "Liaise with transport partners and vendors on cost and service levels."),
                    List.of("Strong coordination and problem-solving skills.",
                            "Understanding of logistics and warehouse operations.",
                            "Ability to work under time-sensitive delivery pressures."),
                    "keep goods moving reliably across the supply chain",
                    List.of("LOGISTICS"), 0.65),

            new Cat("Retail", "Retail", "Store Manager", "Retail Sales Associate",
                    List.of("Retail Operations", "Customer Service", "Inventory Management", "Visual Merchandising", "Team Handling"),
                    List.of("POS Systems", "Sales Forecasting", "Loss Prevention"),
                    "Bachelor's degree in any discipline",
                    List.of("Manage day-to-day store operations and customer experience.",
                            "Drive sales targets through effective merchandising and service.",
                            "Supervise and coach store staff to deliver excellent service.",
                            "Monitor inventory levels and coordinate stock replenishment."),
                    List.of("Strong customer-service and people-management skills.",
                            "Ability to work in a fast-paced retail environment.",
                            "Experience with retail operations or POS systems is a plus."),
                    "shape the in-store experience customers remember",
                    List.of("RETAIL"), 0.6),

            new Cat("Legal", "Legal", "Legal Associate", "Corporate Counsel",
                    List.of("Contract Drafting", "Legal Research", "Compliance", "Legal Documentation", "Negotiation"),
                    List.of("Litigation Support", "Corporate Law", "Regulatory Filings"),
                    "Bachelor's/Master's degree in Law (LLB/LLM)",
                    List.of("Draft, review, and negotiate commercial contracts and agreements.",
                            "Provide legal advice on regulatory and compliance matters.",
                            "Support litigation and dispute resolution processes as needed.",
                            "Ensure the organisation's legal documentation is accurate and current."),
                    List.of("Law degree with relevant bar registration where applicable.",
                            "Strong drafting, negotiation, and research skills.",
                            "Sound understanding of corporate and commercial law."),
                    "protect the organisation's interests across every commercial relationship",
                    List.of("LEGAL", "BANK_FIN", "CONSULTING"), 1.0),

            new Cat("Administration", "Administration", "Administrative Executive", "Office Manager",
                    List.of("Office Administration", "MS Office Suite", "Scheduling", "Data Entry", "Communication"),
                    List.of("Vendor Coordination", "Facility Management", "Travel Coordination"),
                    "Bachelor's degree in any discipline",
                    List.of("Manage day-to-day office administration and facility operations.",
                            "Coordinate schedules, meetings, and travel arrangements.",
                            "Maintain records, correspondence, and office supplies.",
                            "Support cross-functional teams with administrative needs."),
                    List.of("Strong organisational and multitasking skills.",
                            "Proficiency in MS Office and office management tools.",
                            "Professional communication and coordination abilities."),
                    "keep the office running smoothly so teams can focus on their work",
                    List.of("CONSULTING", "EDUCATION", "HEALTHCARE", "RETAIL"), 0.6)
    );
}
