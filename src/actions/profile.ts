"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type {
  AvatarFormState,
  DeleteAccountFormState,
  PasswordFormState,
  ProfileFormState,
} from "@/actions/profile-state";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Adja meg a teljes nevét (legalább 2 karakter).")
    .max(100, "A név legfeljebb 100 karakter lehet."),
  phone: z
    .string()
    .trim()
    .max(40, "A telefonszám túl hosszú.")
    .refine(
      (value) =>
        value === "" ||
        /^[+0-9][\d\s\-()/]{5,38}$/.test(value),
      "Érvényes telefonszámot adjon meg.",
    ),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Adja meg a jelenlegi jelszavát."),
    password: z
      .string()
      .min(8, "A jelszó legyen legalább 8 karakter.")
      .max(72, "A jelszó legfeljebb 72 karakter lehet."),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "A két jelszó nem egyezik.",
    path: ["passwordConfirm"],
  });

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Adja meg a jelszavát a törléshez."),
  confirm: z
    .string()
    .refine((value) => value === "on" || value === "true" || value === "1", {
      message: "Erősítse meg a fiók törlését.",
    }),
});

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const raw = {
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  };

  const parsed = profileSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: ProfileFormState["fieldErrors"] = {};

    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "fullName" || key === "phone") {
        fieldErrors[key] ??= issue.message;
      }
    }

    return {
      status: "error",
      message: "Kérjük, javítsa a kiemelt mezőket.",
      fieldErrors,
    };
  }

  const { fullName, phone } = parsed.data;
  const phoneValue = phone === "" ? null : phone;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phoneValue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return {
      status: "error",
      message: "A profil mentése nem sikerült. Próbálja újra később.",
      fieldErrors: {},
    };
  }

  await supabase.auth.updateUser({
    data: { full_name: fullName },
  });

  revalidatePath("/profil");
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "A profil adatai mentve.",
    fieldErrors: {},
  };
}

export async function updatePassword(
  _prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const raw = {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  };

  const parsed = passwordSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: PasswordFormState["fieldErrors"] = {};

    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (
        key === "currentPassword" ||
        key === "password" ||
        key === "passwordConfirm"
      ) {
        fieldErrors[key] ??= issue.message;
      }
    }

    return {
      status: "error",
      message: "Kérjük, javítsa a kiemelt mezőket.",
      fieldErrors,
    };
  }

  const { currentPassword, password } = parsed.data;

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return {
      status: "error",
      message: "A jelenlegi jelszó helytelen.",
      fieldErrors: { currentPassword: "A jelenlegi jelszó helytelen." },
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      status: "error",
      message: "A jelszó módosítása nem sikerült. Próbálja újra később.",
      fieldErrors: {},
    };
  }

  revalidatePath("/profil");

  return {
    status: "success",
    message: "A jelszó sikeresen módosítva.",
    fieldErrors: {},
  };
}

export async function deleteAccount(
  _prevState: DeleteAccountFormState,
  formData: FormData,
): Promise<DeleteAccountFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const raw = {
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  };

  const parsed = deleteAccountSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: DeleteAccountFormState["fieldErrors"] = {};

    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "password" || key === "confirm") {
        fieldErrors[key] ??= issue.message;
      }
    }

    return {
      status: "error",
      message: "Kérjük, javítsa a kiemelt mezőket.",
      fieldErrors,
    };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });

  if (verifyError) {
    return {
      status: "error",
      message: "A jelszó helytelen.",
      fieldErrors: { password: "A jelszó helytelen." },
    };
  }

  try {
    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      return {
        status: "error",
        message: "A fiók törlése nem sikerült. Próbálja újra később.",
        fieldErrors: {},
      };
    }
  } catch {
    return {
      status: "error",
      message:
        "A fiók törlése jelenleg nem elérhető. Lépjen kapcsolatba a klubbal.",
      fieldErrors: {},
    };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/?notice=account-deleted");
}

export async function uploadAvatar(
  _prevState: AvatarFormState,
  formData: FormData,
): Promise<AvatarFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const file = formData.get("avatar");
  if (!file || !(file instanceof File) || file.size === 0) {
    return {
      status: "error",
      message: "Kérjük, válasszon ki egy képfájlt.",
    };
  }

  if (file.size > 2 * 1024 * 1024) {
    return {
      status: "error",
      message: "A kép mérete legfeljebb 2 MB lehet.",
    };
  }

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      status: "error",
      message: "Csak JPG, PNG, WEBP vagy GIF képformátum tölthető fel.",
    };
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  let uploadError: Error | null = null;
  const userUpload = await supabase.storage
    .from("avatars")
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (userUpload.error) {
    try {
      const adminClient = createAdminClient();
      const { data: buckets } = await adminClient.storage.listBuckets();
      if (!buckets?.some((b) => b.name === "avatars")) {
        await adminClient.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: 2097152,
          allowedMimeTypes,
        });
      }

      const adminUpload = await adminClient.storage
        .from("avatars")
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });

      if (adminUpload.error) {
        uploadError = new Error(adminUpload.error.message);
      }
    } catch {
      uploadError = new Error(userUpload.error.message);
    }
  }

  if (uploadError) {
    return {
      status: "error",
      message: `A feltöltés sikertelen: ${uploadError.message}`,
    };
  }

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const avatarUrl = publicUrlData.publicUrl;

  // Update Auth user metadata (always supported out-of-the-box)
  await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });

  // Also update profiles table if the column exists
  try {
    await supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  } catch {
    // Silently ignore if profiles table doesn't have avatar_url column yet
  }

  revalidatePath("/profil");
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "A profilkép sikeresen frissítve.",
    avatarUrl,
  };
}

export async function deleteAvatar(): Promise<AvatarFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Remove from Auth user metadata
  await supabase.auth.updateUser({
    data: { avatar_url: null },
  });

  // Also update profiles table if the column exists
  try {
    await supabase
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);
  } catch {
    // Silently ignore if profiles table doesn't have avatar_url column yet
  }

  revalidatePath("/profil");
  revalidatePath("/", "layout");

  return {
    status: "success",
    message: "A profilkép eltávolítva.",
    avatarUrl: null,
  };
}

