"use client";

import { ChevronDown } from "lucide-react";
import React, { useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import styles from "./phone-input.module.css";

export const COUNTRY_CODES = [
  { code: "+36", iso: "HU", flag: "🇭🇺", name: "Magyarország" },
  { code: "+43", iso: "AT", flag: "🇦🇹", name: "Ausztria" },
  { code: "+49", iso: "DE", flag: "🇩🇪", name: "Németország" },
  { code: "+421", iso: "SK", flag: "🇸🇰", name: "Szlovákia" },
  { code: "+40", iso: "RO", flag: "🇷🇴", name: "Románia" },
  { code: "+385", iso: "HR", flag: "🇭🇷", name: "Horvátország" },
  { code: "+386", iso: "SI", flag: "🇸🇮", name: "Szlovénia" },
  { code: "+381", iso: "RS", flag: "🇷🇸", name: "Szerbia" },
  { code: "+380", iso: "UA", flag: "🇺🇦", name: "Ukrajna" },
  { code: "+41", iso: "CH", flag: "🇨🇭", name: "Svájc" },
  { code: "+44", iso: "GB", flag: "🇬🇧", name: "Egyesült Királyság" },
  { code: "+1", iso: "US", flag: "🇺🇸", name: "USA / Kanada" },
  { code: "+39", iso: "IT", flag: "🇮🇹", name: "Olaszország" },
  { code: "+33", iso: "FR", flag: "🇫🇷", name: "Franciaország" },
  { code: "+31", iso: "NL", flag: "🇳🇱", name: "Hollandia" },
  { code: "+48", iso: "PL", flag: "🇵🇱", name: "Lengyelország" },
  { code: "+420", iso: "CZ", flag: "🇨🇿", name: "Csehország" },
] as const;

function parseInitialPhone(value?: string | null): {
  country: string;
  digits: string;
} {
  if (!value) {
    return { country: "+36", digits: "" };
  }

  const cleaned = value.trim();

  // Try matching with known country codes
  for (const item of COUNTRY_CODES) {
    if (cleaned.startsWith(item.code)) {
      return {
        country: item.code,
        digits: cleaned.slice(item.code.length).replace(/\D/g, ""),
      };
    }
  }

  // Handle standard domestic Hungarian prefix (06...)
  if (cleaned.startsWith("06")) {
    return {
      country: "+36",
      digits: cleaned.slice(2).replace(/\D/g, ""),
    };
  }

  // If starts with another + code
  if (cleaned.startsWith("+")) {
    const match = cleaned.match(/^(\+\d{1,4})/);
    if (match) {
      return {
        country: match[1],
        digits: cleaned.slice(match[1].length).replace(/\D/g, ""),
      };
    }
  }

  return {
    country: "+36",
    digits: cleaned.replace(/\D/g, ""),
  };
}

export function formatPhoneNumber(digits: string, countryCode: string): string {
  if (!digits) return "";

  if (countryCode === "+36") {
    // Hungarian numbers: 9 digits max (e.g. 30 123 4567 or 1 234 5678)
    const d = digits.slice(0, 9);
    if (d.startsWith("1")) {
      // Budapest landline
      if (d.length <= 1) return d;
      if (d.length <= 4) return `${d.slice(0, 1)} ${d.slice(1)}`;
      return `${d.slice(0, 1)} ${d.slice(1, 4)} ${d.slice(4)}`;
    }
    // 2-digit area code (mobile or countryside)
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
    return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  }

  // Generic formatting for other countries (chunks of 3 or 4)
  const d = digits.slice(0, 12);
  const chunks: string[] = [];
  for (let i = 0; i < d.length; i += 3) {
    chunks.push(d.slice(i, i + 3));
  }
  return chunks.join(" ");
}

export type PhoneInputProps = {
  id?: string;
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  className?: string;
  onChange?: (fullNumber: string) => void;
};

export function PhoneInput({
  id: explicitId,
  name = "phone",
  defaultValue = "",
  disabled = false,
  placeholder,
  ariaInvalid = false,
  ariaDescribedBy,
  ariaLabelledBy,
  className,
  onChange,
}: PhoneInputProps) {
  const autoId = useId();
  const id = explicitId || autoId;
  const inputRef = useRef<HTMLInputElement>(null);

  const initial = useMemo(() => parseInitialPhone(defaultValue), [defaultValue]);
  const [selectedCountry, setSelectedCountry] = useState(initial.country);
  const [rawDigits, setRawDigits] = useState(initial.digits);
  const [isFocused, setIsFocused] = useState(false);

  const formattedNumber = useMemo(
    () => formatPhoneNumber(rawDigits, selectedCountry),
    [rawDigits, selectedCountry],
  );

  const fullPhoneNumber = rawDigits
    ? `${selectedCountry} ${formattedNumber}`
    : "";

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setSelectedCountry(newCountry);
    const newFormatted = formatPhoneNumber(rawDigits, newCountry);
    const newFull = rawDigits ? `${newCountry} ${newFormatted}` : "";
    onChange?.(newFull);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow keyboard shortcuts
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];

    if (allowedKeys.includes(e.key)) {
      // Smart backspace: if deleting backwards on a formatting space, delete preceding digit
      if (e.key === "Backspace" && inputRef.current) {
        const { selectionStart, selectionEnd, value } = inputRef.current;
        if (
          selectionStart === selectionEnd &&
          selectionStart !== null &&
          selectionStart > 0 &&
          value[selectionStart - 1] === " "
        ) {
          e.preventDefault();
          const digitsBefore = value
            .slice(0, selectionStart - 1)
            .replace(/\D/g, "");
          const digitsAfter = value.slice(selectionStart).replace(/\D/g, "");
          const newDigits = digitsBefore.slice(0, -1) + digitsAfter;
          setRawDigits(newDigits);
          const newFormatted = formatPhoneNumber(newDigits, selectedCountry);
          const newFull = newDigits ? `${selectedCountry} ${newFormatted}` : "";
          onChange?.(newFull);
        }
      }
      return;
    }

    // Strictly disallow any letter or non-numeric character
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Filter out any non-digits (e.g. from mobile suggestions, speech, etc.)
    const cleanDigits = e.target.value.replace(/\D/g, "");
    setRawDigits(cleanDigits);

    const newFormatted = formatPhoneNumber(cleanDigits, selectedCountry);
    const newFull = cleanDigits ? `${selectedCountry} ${newFormatted}` : "";
    onChange?.(newFull);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const parsed = parseInitialPhone(pastedText);

    // If pasted string contained a country code, adopt it
    if (parsed.country && parsed.country !== selectedCountry) {
      setSelectedCountry(parsed.country);
    }

    const newDigits = parsed.digits;
    setRawDigits(newDigits);

    const targetCountry = parsed.country || selectedCountry;
    const newFormatted = formatPhoneNumber(newDigits, targetCountry);
    const newFull = newDigits ? `${targetCountry} ${newFormatted}` : "";
    onChange?.(newFull);
  };

  const defaultPlaceholder =
    selectedCountry === "+36" ? "30 123 4567" : "123 456 789";

  return (
    <div
      className={cn(
        styles.phoneInputContainer,
        isFocused && styles.phoneInputContainerFocused,
        ariaInvalid && styles.phoneInputContainerInvalid,
        disabled && styles.phoneInputContainerDisabled,
        className,
      )}
      role="group"
      aria-labelledby={ariaLabelledBy}
    >
      <div className={styles.countrySelectWrapper}>
        <label htmlFor={`${id}-country`} className="sr-only">
          Országkód kiválasztása
        </label>
        <select
          id={`${id}-country`}
          value={selectedCountry}
          disabled={disabled}
          onChange={handleCountryChange}
          className={styles.countrySelect}
          aria-label="Országkód kiválasztása"
        >
          {COUNTRY_CODES.map((item) => (
            <option key={item.code} value={item.code}>
              {item.flag} {item.code} ({item.iso})
            </option>
          ))}
        </select>
        <ChevronDown className={styles.selectChevron} aria-hidden />
      </div>

      <div className={styles.divider} aria-hidden />

      <input
        ref={inputRef}
        id={id}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="tel-national"
        value={formattedNumber}
        placeholder={placeholder || defaultPlaceholder}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={styles.numberInput}
      />

      {/* Hidden input to pass complete formatted international number in FormData */}
      <input type="hidden" name={name} value={fullPhoneNumber} />
    </div>
  );
}
