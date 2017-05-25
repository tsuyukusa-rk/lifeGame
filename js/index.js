(($) => {
  const init = () => {
    $.jCanvas.defaults.fromCenter = false;
    const scale = 2;
    const selSize = 4;
    const $life = $('#life').scaleCanvas({ scale: scale });
    const $lifeBg = $('#life_bg').scaleCanvas({ scale: scale });
    const width = $life.width() * scale;
    const height = $life.height() * scale;
    const rectSetting = {
      x: 0,
      y: 0,
      width: width,
      height: height
    };
    const lineSetting = {
      strokeStyle: '#555',
      strokeWidth: 1
    };
    const calcCoordinate = (num) => {
      return (num - (num % (selSize + lineSetting.strokeWidth))) - (lineSetting.strokeWidth / scale);
    };
    const drawLine = () => {
      let data = [];
      let initData = [];
      let num = 0;
      for(let i = selSize; i <= width; i+=(selSize + lineSetting.strokeWidth)) {
        $lifeBg.drawLine(Object.assign({x1: 0, y1: i, x2: width, y2: i}, lineSetting));
        initData.push(0);
      }
      for(let i = selSize; i <= height; i+=(selSize + lineSetting.strokeWidth)) {
        $lifeBg.drawLine(Object.assign({x1: i, y1: 0, x2: i, y2: height}, lineSetting));
        data[num] = [];
        data[num] = _.cloneDeep(initData);
        num++;
      }
      return data;
    };
    const drawCanvas = () => {
      $life.clearCanvas();
      $life.drawRect(Object.assign({ fillStyle: 'rgba(255, 255, 255, 0)' }, rectSetting));
      for(let i = 0; i < data.length; i++) {
        let j = 0;
        for(j; j < data[i].length; j++) {
          if(data[i][j]) {
            $life.drawRect({
              fillStyle: '#000',
              x: (j*(selSize + lineSetting.strokeWidth)) - (lineSetting.strokeWidth / scale),
              y: (i*(selSize + lineSetting.strokeWidth)) - (lineSetting.strokeWidth / scale),
              width: selSize,
              height: selSize
            });
          }
        }
      }
    };
    $life.drawRect(Object.assign({ fillStyle: 'rgba(255, 255, 255, 0)' }, rectSetting))
      .on('click', (e) => {
        const rect = e.target.getBoundingClientRect();
        const mouseX = calcCoordinate(Math.floor(e.clientX - rect.left));
        const mouseY = calcCoordinate(Math.floor(e.clientY - rect.top));
        const pointX = Math.round(Math.abs(mouseX / (selSize + lineSetting.strokeWidth)));
        const pointY = Math.round(Math.abs(mouseY / (selSize + lineSetting.strokeWidth)));
        data[pointY][pointX] = (data[pointY][pointX]) ? 0 : 1 ;
        drawCanvas();
      });
    $lifeBg.drawRect(Object.assign({ fillStyle: '#fff' }, rectSetting));
    let data = drawLine();
    $('#play').on('click', (e) => {
      const life = () => {
        let data2 = _.cloneDeep(data);
        for(let i = 0; i < data.length; i++) {
          let j = 0;
          for(j; j < data[i].length; j++) {
            let iMinus = (i)?i-1:i;
            let iPlus = (i<data2.length-1)?i+1:i;
            let jMinus = (j)?j-1:j;
            let jPlus = (j<data2.length-1)?j+1:j;
            let self = data2[i][j];
            let topLeft = data2[iMinus][jMinus];
            let topCenter = data2[iMinus][j];
            let topRight = data2[iMinus][jPlus];
            let rightCenter = data2[i][jPlus];
            let bottomRight = data2[iPlus][jPlus];
            let bottomCenter = data2[iPlus][j];
            let bottomLeft = data2[iPlus][jMinus];
            let leftCenter = data2[i][jMinus];
            let sum = topLeft + topCenter + topRight + rightCenter + bottomRight + bottomCenter + bottomLeft + leftCenter;
            if(sum === 3) {
              data[i][j] = 1;
            } else if(sum === 2) {
              data[i][j] = data[i][j];
            } else {
              data[i][j] = 0;
            }
          }
        }
      };
      setInterval(() => {
        life();
        drawCanvas();
      },50);
    });
  };
  $(() => {
    init();
  });
})($);
