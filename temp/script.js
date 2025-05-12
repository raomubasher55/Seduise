function acceptAge() {
  document.getElementById('agePopup').style.display = 'none';
  localStorage.setItem('ageVerified', 'true');
}
window.onload = function () {
  if (localStorage.getItem('ageVerified') !== 'true') {
    document.getElementById('agePopup').style.display = 'flex';
  } else {
    document.getElementById('agePopup').style.display = 'none';
  }
};
