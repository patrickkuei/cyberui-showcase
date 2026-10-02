import { OWNER_LABEL, type Owner } from '../content/processStages';

/** The owner label on a stage row; mirrors the overview strip's squares on purpose (outline = yours, cyan fill = included). */
export function OwnerTag({ owner }: { owner: Owner }) {
  return <span className={`owner-tag owner-tag-${owner}`}>{OWNER_LABEL[owner]}</span>;
}
