// The design system's public surface.
//
// This barrel exists so `@/components/ui` keeps resolving after the original
// single file was split — every existing import kept working without being
// touched. Import from here, not from the modules directly.
//
// Where things live:
//
//   tone.ts      the five semantic states, and `cn`
//   button.tsx   Button, ButtonLink, LinkButton
//   card.tsx     Card, CardHeader
//   badge.tsx    Badge, PulseBadge
//   alert.tsx    Alert, FormError
//   form.tsx     Field, FieldGroup, Input, Textarea, Select, SearchInput, ChoiceChip
//   feedback.tsx Spinner, Skeleton, Loading, EmptyState, SetupProblem
//   layout.tsx   PageHeading, Stat, DetailList, Overline

export { cn, TONE_TEXT, TONE_SURFACE, TONE_BORDER, type Tone } from "@/components/ui/tone";

export {
  Button,
  ButtonLink,
  LinkButton,
  type ButtonVariant,
  type ButtonSize,
} from "@/components/ui/button";

export { Card, CardHeader, type CardPadding, type CardElevation } from "@/components/ui/card";

export { Badge, PulseBadge } from "@/components/ui/badge";

export { Alert, FormError } from "@/components/ui/alert";

export {
  Field,
  FieldGroup,
  Input,
  Textarea,
  Select,
  SearchInput,
  ChoiceChip,
  fieldDescribedBy,
  inputClassName,
} from "@/components/ui/form";

export { Spinner, Skeleton, Loading, EmptyState, SetupProblem } from "@/components/ui/feedback";

export { PageHeading, Stat, DetailList, Overline, type DetailRow } from "@/components/ui/layout";

export { toast, dismiss, Toaster, type ToastTone } from "@/components/ui/toast";
