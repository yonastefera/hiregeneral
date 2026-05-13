export type ProfileOption = {
  value: string;
  label: string;
};

export const stateOptions = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DC", label: "District of Columbia" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "MD", label: "Maryland" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
] as const satisfies readonly ProfileOption[];

export const genderOptions = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "non_binary", label: "Non-binary" },
  { value: "self_describe", label: "I prefer to self-describe" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const satisfies readonly ProfileOption[];

export const ethnicityOptions = [
  {
    value: "american_indian_or_alaska_native",
    label: "American Indian or Alaska Native",
  },
  { value: "asian", label: "Asian" },
  { value: "black_or_african_american", label: "Black or African American" },
  { value: "hispanic_or_latino", label: "Hispanic or Latino" },
  {
    value: "middle_eastern_or_north_african",
    label: "Middle Eastern or North African",
  },
  {
    value: "native_hawaiian_or_other_pacific_islander",
    label: "Native Hawaiian or Other Pacific Islander",
  },
  { value: "white", label: "White" },
  { value: "two_or_more", label: "Two or more races/ethnicities" },
  { value: "self_describe", label: "I prefer to self-describe" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const satisfies readonly ProfileOption[];

export const veteranStatusOptions = [
  { value: "not_veteran", label: "I am not a veteran" },
  { value: "protected_veteran", label: "I identify as a protected veteran" },
  {
    value: "veteran_not_protected",
    label: "I am a veteran, but not a protected veteran",
  },
  { value: "not_sure", label: "I am not sure" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const satisfies readonly ProfileOption[];

export const disabilityStatusOptions = [
  {
    value: "yes",
    label: "Yes, I have a disability or have had one in the past",
  },
  {
    value: "no",
    label: "No, I do not have a disability and have not had one in the past",
  },
  { value: "prefer_not_to_say", label: "I do not want to answer" },
] as const satisfies readonly ProfileOption[];

export const degreeOptions = [
  { value: "high_school", label: "High school diploma or GED" },
  { value: "certificate", label: "Certificate" },
  { value: "associate", label: "Associate degree" },
  { value: "bachelor", label: "Bachelor’s degree" },
  { value: "master", label: "Master’s degree" },
  { value: "doctorate", label: "Doctorate" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "some_college", label: "Some college" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const satisfies readonly ProfileOption[];

export const experienceLevelOptions = [
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior level" },
  { value: "lead", label: "Lead / principal" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
  { value: "executive", label: "Executive" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const satisfies readonly ProfileOption[];

export const industryOptions = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "government", label: "Government" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "hospitality", label: "Hospitality" },
  { value: "construction", label: "Construction" },
  { value: "transportation", label: "Transportation" },
  { value: "other", label: "Other" },
] as const satisfies readonly ProfileOption[];

export const schoolSuggestions = [
  "University of Maryland",
  "University of Maryland Global Campus",
  "Marymount University",
  "Howard University",
  "Georgetown University",
  "George Washington University",
  "American University",
  "Towson University",
  "Morgan State University",
  "Bowie State University",
  "Montgomery College",
  "Northern Virginia Community College",
  "Community College of Baltimore County",
  "University of Virginia",
  "Virginia Tech",
  "George Mason University",
  "Johns Hopkins University",
  "Penn State University",
  "Rutgers University",
  "University of Pennsylvania",
] as const;

export const educationYearOptions = Array.from({ length: 70 }, (_, index) => {
  const year = new Date().getFullYear() + 5 - index;

  return {
    value: String(year),
    label: String(year),
  };
});

export function getOptionLabel(
  options: readonly ProfileOption[],
  value: string | null | undefined,
) {
  if (!value) return null;

  return options.find((option) => option.value === value)?.label ?? value;
}
