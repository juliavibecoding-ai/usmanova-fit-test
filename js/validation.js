export function validateLead({ name = "", contact = "", program = "" }) {
  const errors = {};

  if (!name.trim()) errors.name = "Введите имя";
  if (!contact.trim()) errors.contact = "Введите телефон или Telegram";
  if (!program.trim()) errors.program = "Выберите программу";

  return errors;
}
