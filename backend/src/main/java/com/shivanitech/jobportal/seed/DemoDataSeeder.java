package com.shivanitech.jobportal.seed;

import com.shivanitech.jobportal.entity.Company;
import com.shivanitech.jobportal.entity.CompanyStatus;
import com.shivanitech.jobportal.entity.CandidateProfile;
import com.shivanitech.jobportal.entity.EmployeeProfile;
import com.shivanitech.jobportal.entity.Job;
import com.shivanitech.jobportal.entity.JobCategory;
import com.shivanitech.jobportal.entity.JobDesignation;
import com.shivanitech.jobportal.entity.JobLocation;
import com.shivanitech.jobportal.entity.JobStatus;
import com.shivanitech.jobportal.entity.Role;
import com.shivanitech.jobportal.entity.Skill;
import com.shivanitech.jobportal.entity.User;
import com.shivanitech.jobportal.repository.CompanyRepository;
import com.shivanitech.jobportal.repository.CandidateProfileRepository;
import com.shivanitech.jobportal.repository.EmployeeProfileRepository;
import com.shivanitech.jobportal.repository.JobCategoryRepository;
import com.shivanitech.jobportal.repository.JobDesignationRepository;
import com.shivanitech.jobportal.repository.JobLocationRepository;
import com.shivanitech.jobportal.repository.JobRepository;
import com.shivanitech.jobportal.repository.SkillRepository;
import com.shivanitech.jobportal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Populates the platform with a large, realistic demonstration dataset: job categories,
 * locations, skills, designations, verified companies, and job postings across every
 * category defined in {@link SeedCatalog} (plus top-up jobs for any pre-existing legacy
 * categories so every category in the system ends up with at least ten postings). Every
 * description is original text generated from templates - it does not copy any real job
 * advertisement. Runs once; safe to leave enabled across restarts because it checks for
 * its own sentinel category before doing any work.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DemoDataSeeder implements CommandLineRunner {

    private static final String DEMO_PASSWORD = "Demo@12345";
    private static final DateTimeFormatter DEADLINE_FORMAT = DateTimeFormatter.ofPattern("d MMMM yyyy");
    private static final int JOBS_PER_CATEGORY = 10;

    /** Pre-existing broad categories (from before this catalog) mapped to a donor spec to top them up to 10 jobs. */
    private static final Map<String, String> LEGACY_TOPUP_DONOR = Map.of(
            "Data & Analytics", "Data Science",
            "Design", "UI/UX Design",
            "Sales & Marketing", "Sales",
            "Engineering", "Software Development"
    );

    private final JobCategoryRepository categoryRepository;
    private final JobDesignationRepository designationRepository;
    private final JobLocationRepository locationRepository;
    private final SkillRepository skillRepository;
    private final CompanyRepository companyRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final EmployeeProfileRepository employeeProfileRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final PasswordEncoder passwordEncoder;

    private Map<String, JobLocation> locations;
    private Map<String, Company> companies;
    private Map<String, JobCategory> categoryCache;
    private Map<String, JobDesignation> designationCache;
    private Map<String, Skill> skillCache;

    @Override
    @Transactional
    public void run(String... args) {
        ensureDemoAccounts();

        boolean alreadySeeded = categoryRepository.findAll().stream()
                .anyMatch(c -> c.getName().equals(SeedCatalog.SENTINEL_CATEGORY));

        locations = ensureLocations();
        companies = ensureCompanies();
        categoryCache = new HashMap<>();
        designationCache = new HashMap<>();
        skillCache = new HashMap<>();
        for (JobCategory c : categoryRepository.findAll()) categoryCache.put(c.getName(), c);
        for (JobDesignation d : designationRepository.findAll()) designationCache.put(d.getName(), d);
        for (Skill s : skillRepository.findAll()) skillCache.put(s.getName(), s);

        int jobCount = 0;
        Set<String> locationsUsed = new HashSet<>();
        Set<String> departmentsUsed = new HashSet<>();
        Map<String, SeedCatalog.Cat> catsByName = new HashMap<>();
        for (SeedCatalog.Cat c : SeedCatalog.CATEGORIES) catsByName.put(c.name(), c);

        int categoryIndex = 0;
        if (!alreadySeeded) {
            log.info("Seeding demo job catalog: {} categories...", SeedCatalog.CATEGORIES.size());
            for (SeedCatalog.Cat cat : SeedCatalog.CATEGORIES) {
                JobCategory category = categoryCache.computeIfAbsent(cat.name(),
                        n -> categoryRepository.save(JobCategory.builder().name(n).build()));
                departmentsUsed.add(cat.department());
                jobCount += seedRowsForCategory(cat, category, categoryIndex, 0, JOBS_PER_CATEGORY, locationsUsed);
                categoryIndex++;
            }
        } else {
            categoryIndex = SeedCatalog.CATEGORIES.size();
        }

        // Top up any pre-existing legacy categories (created before this catalog existed) to at least
        // JOBS_PER_CATEGORY postings each, so every category in the system meets the minimum. Runs on
        // every startup (idempotent - only adds rows while a legacy category is still under the minimum).
        for (JobCategory legacyCategory : categoryRepository.findAll()) {
            if (catsByName.containsKey(legacyCategory.getName())) continue; // handled by the main catalog above
            String donorName = LEGACY_TOPUP_DONOR.get(legacyCategory.getName());
            if (donorName == null) continue;
            SeedCatalog.Cat donor = catsByName.get(donorName);
            if (donor == null) continue;
            long existing = jobRepository.findAll().stream()
                    .filter(j -> j.getCategory().getId().equals(legacyCategory.getId()))
                    .count();
            if (existing >= JOBS_PER_CATEGORY) continue;
            int toAdd = (int) (JOBS_PER_CATEGORY - existing);
            jobCount += seedRowsForCategory(donor, legacyCategory, categoryIndex, 0, toAdd, locationsUsed);
            categoryIndex++;
        }

        if (jobCount > 0) {
            log.info("Demo catalog seed pass complete: {} companies, {} locations touched, {} jobs created this run.",
                    companies.size(), locationsUsed.size(), jobCount);
            if (!departmentsUsed.isEmpty()) {
                log.info("Departments covered: {}", String.join(", ", departmentsUsed));
            }
        } else {
            log.info("Demo job catalog already complete - no new jobs needed.");
        }
    }

    /**
     * Keeps the credentials documented in DEMO_GUIDE.md usable after a clean database start.
     * Each account is created independently, making this safe on existing installations.
     */
    private void ensureDemoAccounts() {
        createUserIfMissing("admin@shivanitech.in", "admin123", Role.ADMIN, true);

        if (!userRepository.existsByEmail("candidate@shivanitech.in")) {
            User candidate = userRepository.save(User.builder()
                    .email("candidate@shivanitech.in")
                    .password(passwordEncoder.encode("Candidate@123"))
                    .role(Role.CANDIDATE)
                    .verified(true)
                    .enabled(true)
                    .build());
            candidateProfileRepository.save(CandidateProfile.builder()
                    .user(candidate)
                    .fullName("Ananya Rao")
                    .currentLocation("Bengaluru")
                    .qualification("B.Tech")
                    .experienceYears(3)
                    .build());
        }

        if (!userRepository.existsByEmail("employee@shivanitech.in")) {
            User employee = userRepository.save(User.builder()
                    .email("employee@shivanitech.in")
                    .password(passwordEncoder.encode("Employee@123"))
                    .role(Role.EMPLOYEE)
                    .verified(true)
                    .enabled(true)
                    .build());
            employeeProfileRepository.save(EmployeeProfile.builder()
                    .user(employee)
                    .fullName("Priya Sharma")
                    .designation("Recruitment Executive")
                    .build());
        }

        if (!userRepository.existsByEmail("employer@shivanitech.in")) {
            User employer = userRepository.save(User.builder()
                    .email("employer@shivanitech.in")
                    .password(passwordEncoder.encode("Employer@123"))
                    .role(Role.EMPLOYER)
                    .verified(true)
                    .enabled(true)
                    .build());
            companyRepository.save(Company.builder()
                    .user(employer)
                    .name("Nexora Technologies")
                    .contactEmail(employer.getEmail())
                    .status(CompanyStatus.ACTIVE)
                    .build());
        }
    }

    private void createUserIfMissing(String email, String password, Role role, boolean verified) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        userRepository.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(role)
                .verified(verified)
                .enabled(true)
                .build());
    }

    /** Generates up to {@code count} job rows (0-indexed grid position {@code startRow}..) for one category. */
    private int seedRowsForCategory(SeedCatalog.Cat cat, JobCategory category, int categoryIndex, int startRow,
                                     int count, Set<String> locationsUsed) {
        List<String> companyPool = SeedCatalog.companiesForTags(cat.domainTags());
        if (companyPool.isEmpty()) {
            companyPool = List.of("Infosys");
        }

        Set<Skill> requiredSkills = new HashSet<>();
        for (String name : cat.reqSkills()) {
            requiredSkills.add(skillCache.computeIfAbsent(name,
                    n -> skillRepository.save(Skill.builder().name(n).build())));
        }
        String preferredSkillsText = String.join(", ", cat.prefSkills());
        String requiredSkillsText = String.join(", ", cat.reqSkills());
        String[] stems = {cat.stem0(), cat.stem1()};

        int created = 0;
        for (int row = startRow; row < startRow + count && row < 10; row++) {
            int stemIdx = row / 5;
            int tier = row % 5;
            String title = String.format(SeedCatalog.TIER_TITLE_TEMPLATES[tier], stems[stemIdx]);

            String companyName = companyPool.get((categoryIndex * 3 + row) % companyPool.size());
            Company company = companies.get(companyName);

            boolean remote = row % 3 == 2;
            String locationName = remote ? "Remote"
                    : SeedCatalog.LOCATIONS.get((categoryIndex * 7 + row) % (SeedCatalog.LOCATIONS.size() - 1));
            JobLocation location = locations.get(locationName);
            locationsUsed.add(locationName);

            String workMode = remote ? "Remote" : (row % 3 == 1 ? "Hybrid" : "On-site");

            String employmentType;
            if (tier == 0 && stemIdx == 1) {
                employmentType = "Internship";
            } else if (tier == 1 && stemIdx == 0) {
                String[] rotating = {"Part-Time", "Contract", "Temporary"};
                employmentType = rotating[categoryIndex % rotating.length];
            } else {
                employmentType = "Full-Time";
            }

            int expMin = SeedCatalog.TIER_EXPERIENCE[tier][0];
            int expMax = SeedCatalog.TIER_EXPERIENCE[tier][1];
            int salaryMin = round10k((int) Math.round(SeedCatalog.TIER_BASE_SALARY[tier][0] * cat.salaryMultiplier()));
            int salaryMax = round10k((int) Math.round(SeedCatalog.TIER_BASE_SALARY[tier][1] * cat.salaryMultiplier()));

            int openings = (row % 5) + 1;
            LocalDate deadline = LocalDate.now().plusDays(30 + ((row * 4) % 45));
            List<String> benefits = pickThree(SeedCatalog.BENEFITS, row);

            String companyAbout = SeedCatalog.COMPANY_ABOUT.getOrDefault(companyName,
                    companyName + " is a well-established organisation operating in its industry.");

            String description = buildDescription(companyName, title, cat.department(), locationName,
                    cat.impact(), cat.responsibilities(), SeedCatalog.TIER_RESPONSIBILITY_INTRO[tier],
                    requiredSkillsText, preferredSkillsText, cat.education(), cat.qualifications(),
                    expMin, expMax, employmentType, workMode, openings, deadline, benefits, companyAbout);

            JobDesignation designation = designationCache.computeIfAbsent(title,
                    n -> designationRepository.save(JobDesignation.builder().name(n).build()));

            Job job = Job.builder()
                    .title(title)
                    .description(description)
                    .company(company)
                    .category(category)
                    .designation(designation)
                    .location(location)
                    .skills(new HashSet<>(requiredSkills))
                    .salaryMin(salaryMin)
                    .salaryMax(salaryMax)
                    .experienceMin(expMin)
                    .experienceMax(expMax)
                    .qualification(cat.education())
                    .status(JobStatus.OPEN)
                    .postedByAdmin(false)
                    .build();
            jobRepository.save(job);
            created++;
        }
        return created;
    }

    private Map<String, JobLocation> ensureLocations() {
        Map<String, JobLocation> byName = new HashMap<>();
        for (JobLocation l : locationRepository.findAll()) byName.put(l.getName(), l);
        for (String name : SeedCatalog.LOCATIONS) {
            byName.computeIfAbsent(name, n -> locationRepository.save(JobLocation.builder().name(n).build()));
        }
        return byName;
    }

    private Map<String, Company> ensureCompanies() {
        Map<String, Company> existingByName = new HashMap<>();
        for (Company c : companyRepository.findAll()) existingByName.put(c.getName(), c);

        Map<String, Company> result = new HashMap<>();
        Set<String> allCompanyNames = new HashSet<>();
        for (List<String> pool : SeedCatalog.COMPANIES_BY_TAG.values()) allCompanyNames.addAll(pool);

        for (String name : allCompanyNames) {
            Company existing = existingByName.get(name);
            if (existing != null) {
                result.put(name, existing);
                continue;
            }
            String email = slugify(name) + "@careers.demo.shivanitech.in";
            if (userRepository.existsByEmail(email)) {
                email = slugify(name) + "-" + Integer.toHexString(name.hashCode()) + "@careers.demo.shivanitech.in";
            }
            User user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(DEMO_PASSWORD))
                    .role(Role.EMPLOYER)
                    .verified(true)
                    .enabled(true)
                    .build();
            user = userRepository.save(user);

            Company company = Company.builder()
                    .user(user)
                    .name(name)
                    .contactEmail(email)
                    .status(CompanyStatus.ACTIVE)
                    .build();
            company = companyRepository.save(company);
            result.put(name, company);
        }
        return result;
    }

    private static String slugify(String name) {
        return name.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    private static int round10k(int value) {
        return Math.round(value / 10000f) * 10000;
    }

    private static List<String> pickThree(List<String> pool, int row) {
        int start = row % pool.size();
        return List.of(pool.get(start), pool.get((start + 1) % pool.size()), pool.get((start + 2) % pool.size()));
    }

    private static String buildDescription(String company, String title, String department, String location,
                                            String impact, List<String> responsibilities, String tierIntro,
                                            String requiredSkillsText, String preferredSkillsText, String education,
                                            List<String> qualifications, int expMin, int expMax,
                                            String employmentType, String workMode, int openings,
                                            LocalDate deadline, List<String> benefits, String companyAbout) {
        StringBuilder sb = new StringBuilder();
        sb.append(company).append(" is hiring a ").append(title).append(" to join its ")
                .append(department).append(" team in ").append(location).append(". This is a great opportunity to ")
                .append(impact).append(".\n\n");

        sb.append("Key Responsibilities:\n");
        sb.append("- ").append(tierIntro).append('\n');
        for (String r : responsibilities) {
            sb.append("- ").append(r).append('\n');
        }
        sb.append('\n');

        sb.append("Required Skills: ").append(requiredSkillsText).append('\n');
        sb.append("Preferred Skills: ").append(preferredSkillsText).append("\n\n");

        sb.append("Qualifications:\n");
        sb.append("- ").append(education).append('\n');
        for (String q : qualifications) {
            sb.append("- ").append(q).append('\n');
        }
        sb.append("- ").append(expMin).append(" to ").append(expMax).append(" years of relevant experience.\n\n");

        sb.append("Employment Type: ").append(employmentType)
                .append("  |  Work Mode: ").append(workMode)
                .append("  |  Number of Openings: ").append(openings)
                .append("  |  Application Deadline: ").append(deadline.format(DEADLINE_FORMAT)).append("\n\n");

        sb.append("Benefits:\n");
        for (String b : benefits) {
            sb.append("- ").append(b).append('\n');
        }
        sb.append('\n');

        sb.append("About ").append(company).append(":\n").append(companyAbout);

        return sb.toString();
    }
}
