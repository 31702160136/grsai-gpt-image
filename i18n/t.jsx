import { useTranslations } from "next-intl";

export default function Convert(props) {
  // Call `useTranslations` in a Server Component ...
  const t = useTranslations("Home");
  // ... and pass translated content to a Client Component
  // return <span>{t(props.name)}</span>;
  return t(props.name);
}
