onload = function() {
  draw();
};
function draw() {
  /* canvas�v�f�̃m�[�h�I�u�W�F�N�g */
  var canvas = document.getElementById('canvassample');
  /* canvas�v�f�̑��݃`�F�b�N��Canvas���Ή��u���E�U�̑Ώ� */
  if ( ! canvas || ! canvas.getContext ) {
    return false;
  }
  /* 2D�R���e�L�X�g */
  var ctx = canvas.getContext('2d');
  /* �l�p��`�� */
  ctx.beginPath();
  ctx.moveTo(20, 20);
  ctx.lineTo(120, 20);
  ctx.lineTo(120, 120);
  ctx.lineTo(20, 120);
  ctx.closePath();
  ctx.stroke();
}
