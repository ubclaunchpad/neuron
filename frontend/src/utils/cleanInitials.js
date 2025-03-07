function cleanInitials(initials) {
  return initials.replace(/[^A-Z]/g, '').toUpperCase();
}

export default cleanInitials;