export interface StudentFormValues {
  fullName: string;
  registrationNumber: string;
  phoneNumber: string;
  formFourIndexNumber: string;
}

export interface FormErrors {
  fullName?: string;
  registrationNumber?: string;
  phoneNumber?: string;
  formFourIndexNumber?: string;
}

/**
 * Normalizes Tanzanian phone numbers.
 * "0624847729" -> "255624847729"
 * "+255624847729" -> "255624847729"
 * "255624847729" -> "255624847729" (unchanged)
 */
export function normalizePhoneNumber(raw: string): string {
  let value = raw.trim().replace(/[\s-]/g, "");
  if (value.startsWith("+")) value = value.slice(1);
  if (value.startsWith("0") && value.length === 10) {
    value = "255" + value.slice(1);
  }
  return value;
}

function isValidTanzanianPhone(normalized: string): boolean {
  // 255 followed by 9 digits (typical Tanzanian mobile length)
  return /^255[67]\d{8}$/.test(normalized);
}

function isValidRegistrationNumber(value: string): boolean {
  // Reasonably permissive: letters, numbers and slashes, e.g. RU/BAFIT/2024/10000
  return /^[A-Za-z]{1,10}\/[A-Za-z0-9]{2,15}\/\d{4}\/\d{2,8}$/.test(value.trim());
}

function isValidFormFourIndex(value: string): boolean {
  // Reasonably permissive: e.g. S0123.4567.1900 or S0123/4567/1900
  return /^[A-Za-z]\d{4}[.\/]\d{4}[.\/]\d{4}$/.test(value.trim());
}

export function validateStudentForm(values: StudentFormValues): FormErrors {
  const errors: FormErrors = {};

  const name = values.fullName.trim();
  if (!name) {
    errors.fullName = "Please enter your full name.";
  } else if (name.length < 5) {
    errors.fullName = "Please enter your full name as it appears officially.";
  } else if (!/^[A-Za-z\u00C0-\u024F' -]+$/.test(name)) {
    errors.fullName = "Full name should only contain letters and spaces.";
  } else if (name.split(/\s+/).length < 2) {
    errors.fullName = "Please enter your full name (first and last name).";
  }

  const reg = values.registrationNumber.trim();
  if (!reg) {
    errors.registrationNumber = "Please enter your registration number.";
  } else if (!isValidRegistrationNumber(reg)) {
    errors.registrationNumber =
      "Please enter a valid registration number, e.g. RU/BAFIT/2024/10000.";
  }

  const phone = normalizePhoneNumber(values.phoneNumber);
  if (!values.phoneNumber.trim()) {
    errors.phoneNumber = "Please enter your phone number.";
  } else if (!isValidTanzanianPhone(phone)) {
    errors.phoneNumber =
      "Please enter a valid Tanzanian phone number, e.g. 0624847729.";
  }

  const index = values.formFourIndexNumber.trim();
  if (!index) {
    errors.formFourIndexNumber = "Please enter your Form Four index number.";
  } else if (!isValidFormFourIndex(index)) {
    errors.formFourIndexNumber =
      "Please enter a valid Form Four index number, e.g. S0123.4567.1900.";
  }

  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.values(errors).some(Boolean);
}
