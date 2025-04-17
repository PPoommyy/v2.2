const getPermissions = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    window.location.href = "../../pages/lokin/lokin.php";
    return;
  }

  const userPermissions = user[0].permissions.map((p) => ({
    name: p.name,
    page_url: p.page_url,
  }));
  return userPermissions;
};

export const UserController = {
  getPermissions,
};
