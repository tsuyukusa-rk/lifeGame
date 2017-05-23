const lifeModule = (() => {
	const
		settings = {
			'activeColor': '#eeee00',
			'negativeColor': '#888888',
			'randomizeMode': 'spiral'		// 'normal', 'spiral', 'symmetryX', 'symmetryY'
		};

	const
		col = [ settings.negativeColor, settings.activeColor ],
		life = document.getElementById( 'life' ),
		cv = life.getContext( '2d' ),
		life_bg = document.getElementById( 'life_bg' ),
		cv_bg = life_bg.getContext( '2d' ),
		result_gen = document.getElementById( 'resultgen' ),
		result_rate = document.getElementById( 'resultrate' ),
		bt_play = document.getElementById( 'play' ),
		bt_step = document.getElementById( 'step' ),
		bt_del = document.getElementById( 'del' ),
		bt_rnd = document.getElementById( 'rnd' ),
		rd_speed = document.getElementsByName( 'lifespeed' ),
		ip_cols = document.getElementById( 'ip_cols' ),
		ip_rows = document.getElementById( 'ip_rows' ),
		ip_side = document.getElementById( 'ip_side' ),
		ip_margin = document.getElementById( 'ip_margin' ),
		ip_torus = document.getElementById( 'torus' ),
		sl_rule = document.getElementById( 'sl_rule' ),
		bt_im =  document.getElementById( 'import' ),
		bt_ex =  document.getElementById( 'export' ),
		bt_mclose =  document.getElementById( 'close' ),
		tx_im =  document.getElementById( 'import_area' ),
		tx_ex =  document.getElementById( 'export_area' ),
		modal =  document.getElementById( 'modal' ),
		bt_left =  document.getElementById( 'left' ),
		bt_right =  document.getElementById( 'right' ),
		bt_down =  document.getElementById( 'down' ),
		bt_up =  document.getElementById( 'up' ),
		html_play = '<i class="fa fa-play" aria-hidden="true"></i>',
		html_stop = '<i class="fa fa-stop" aria-hidden="true"></i>';
	let
		rows, cols,
		side, margin, sideSum,
		gen = 0,
		rate = 0,
		now_rule,
		torus,
		old_rate = new Array( 8 ),
		speed, rule, ruleStrB, ruleStrS, ival, fv,
		data = [], dataNext = [],
		join_c = [],
		mode = 'random',
		i, r, c, x, y, start_x, start_y, grid_x, grid_y;

	const func = {
		init: () => {
			func.resetRun();
			func.editRun();
			func.playRun();
			func.torusChangeRun();
			func.speedChangeRun();
			func.test();
			func.modal();
			func.moveRun();
		},

		/* -----------------------------
		// All delete, Reset
		----------------------------- */
		resetRun: () => {
			const reset = e => {
				cols = parseInt( ip_cols.value, 10 );
				rows = parseInt( ip_rows.value, 10 );
				side = parseInt( ip_side.value, 10 );
				margin = parseInt( ip_margin.value, 10 );
				torus = ip_torus.checked;
				sideSum = side + margin;
				life.width = cols * sideSum;
				life.style.width = cols * sideSum + 'px';
				life.height = rows * sideSum;
				life_bg.width = cols * sideSum;
				life_bg.style.width = cols * sideSum + 'px';
				life_bg.height = rows * sideSum;
				life_bg.style.marginTop = - ( rows * sideSum ) + 'px';
				cv_bg.fillStyle = col[0];
				cv.fillStyle = col[1];
				cv.clearRect( 0, 0, cols * sideSum, rows * sideSum );
				for ( r = 0; r <= rows - 1; r++ ) {
					data[r] = [];
					dataNext[r] = [];
					for ( c = 0; c <= cols - 1; c++ ) {
						start_x = c * sideSum;
						start_y = r * sideSum;
						cv_bg.fillRect( start_x, start_y, side, side );
						data[r][c] = 0;
						dataNext[r][c] = 0;
					}
				}
				gen = 0;
				rate = 0;
				func.speedChangeRun();
				func.ruleChange( sl_rule.options[sl_rule.selectedIndex].value );
				func.evaluation();
				if( mode == 'random' ){
					func.randomSetRun();
				}
			};
			window.addEventListener( 'load', reset, false );
			bt_del.addEventListener( 'click', reset, false );
			sl_rule.addEventListener( 'change', reset, false );
		},

		/* -----------------------------
		// Evaluation, Display
		----------------------------- */
		evaluation: () => {
			result_gen.innerText = 'Gen:' + gen;
			result_rate.innerText = ' Rate:' + rate + '/' + ( cols * rows );
		},

		/* -----------------------------
		// Change by click
		----------------------------- */
		editRun: () => {
			let
				active = 0,
				changeCol;
			const edit = e => {
				// Measure pixel coordinates
				let rect = e.target.getBoundingClientRect();
				x = e.clientX - rect.left;
				y = e.clientY - rect.top;
				// Calculate grid coordinates
				grid_x = Math.floor( x / sideSum );
				grid_y = Math.floor( y / sideSum );
				if( e.type === 'mousedown' ){
					if( bt_play.value == 'stop' ){
						bt_play.click();
					}
					active = 1;
					changeCol = data[grid_y][grid_x] ^ 1;
					mode = 'hand';
				} else if( e.type === 'mouseup' || e.type === 'mouseout' ){
					active = 0;
				}
				if( active ){
					data[grid_y][grid_x] = changeCol;
					start_x = x - x % sideSum;
					start_y = y - y % sideSum;
					cv[ changeCol ? 'fillRect' : 'clearRect' ]( start_x, start_y, side, side );
				}
			};
			life.addEventListener( 'mouseup', edit, false );
			life.addEventListener( 'mousedown', edit, false );
			life.addEventListener( 'mousemove', edit, false );
			life.addEventListener( 'mouseout', edit, false );
		},

		/* -----------------------------
		// Play, Stop, Step
		----------------------------- */
		playRun: () => {
			let result, playTimer,
				playStatus = 0,
				cellU, cellC, cellD, cellL, cellR,
				ul, uc, ur, cl, cr, dl, dc, dr,
				rowsFloor, colsFloor, sum, join_all;
			const
				// Determine the current cell's life and death with reference to the rule
				ruleOutput = ( sum, center ) => {
					if( ruleStrB.indexOf( sum ) != -1 && !center  ){
						result = 1;
					} else if( ruleStrS.indexOf( sum ) != -1 && center ){
						result = 1;
					} else {
						result = 0;
					}
					return result;
				},
				play = sw => {
					rate = 0;
					for ( r = 0; r <= rowsFloor; r++ ) {
						cellC = data[ r ];
						cellU = data[ ( r + rowsFloor ) % rows ];
						cellD = data[ ( r + 1 ) % rows ];
						start_y = r * sideSum;
						dataNext[r] = [];
						for ( c = 0; c <= colsFloor; c++ ) {
							cellL = ( c + colsFloor ) % cols;
							cellR = ( c + 1 ) % cols;
							ul = cellU[cellL];
							uc = cellU[c];
							ur = cellU[cellR];
							cl = cellC[cellL];
							cr = cellC[cellR];
							dl = cellD[cellL];
							dc = cellD[c];
							dr = cellD[cellR];
							if( !torus ){
								if( !r ){
									ul = uc = ur = 0;
								} else if ( r == rowsFloor ){
									dl = dc = dr = 0;
								}
								if( !c ){
									ul = cl = dl = 0;
								} else if ( c == colsFloor ){
									ur = cr = dr = 0;
								}
							}
							sum = ul + uc + ur + cl + cr + dl + dc + dr;
							fv = dataNext[r][c] = ruleOutput( sum, cellC[c] );
							rate += fv;
							if( data[r][c] ^ fv ) cv[ fv ? 'fillRect' : 'clearRect' ]( c * sideSum, start_y, side, side );
						}
						join_c[r] = dataNext[r].join('');
					}
					join_all = join_c.join('');
					data = dataNext.slice();
					gen++;
					func.evaluation();
					if( sw == 'play' ) playTimer = setTimeout( () => play( sw ), speed );
				},
				playControl = e => {
					rowsFloor = rows - 1;
					colsFloor = cols - 1;
					if( e.target.value === 'play' && !playStatus ){
						playStatus = 1;
						e.target.value = 'stop';
						e.target.innerHTML = html_stop;
						func.speedChangeRun();
						play( 'play' );
					} else if( e.target.value === 'stop' && playStatus ){
						playStatus = 0;
						e.target.value = 'play';
						e.target.innerHTML = html_play;
						clearTimeout( playTimer );
					} else if( e.target.value === 'step' && !playStatus ){
						if( bt_play.value == 'stop' ){
							bt_play.click();
						}
						play( 'step' );
						clearTimeout( playTimer );
					}
				};
			bt_play.addEventListener( 'click', playControl, false );
			bt_step.addEventListener( 'click', playControl, false );
		},

		/* -----------------------------
		// Changing rules
		----------------------------- */
		ruleChange: rule => {
			if( rule.match( /^B(\d+)\//g ) != null ) {
				ruleStrB = RegExp.$1;
			} else {
				ruleStrB = '';
			}
			if( rule.match( /S(\d+)$/g ) != null ) {
				ruleStrS = RegExp.$1;
			} else {
				ruleStrS = '';
			}
			now_rule = rule;
		},

		/* -----------------------------
		// Changing speed
		----------------------------- */
		speedChangeRun: () => {
			const speedChange = () => {
				for ( i = 0; i <= rd_speed.length - 1; i++ ) {
					if( rd_speed[i].checked ){
						speed = parseInt( rd_speed[i].value, 10 );
						break;
					}
				}
			};
			for ( i = 0; i <= rd_speed.length - 1; i++ ) {
				rd_speed[i].addEventListener( 'change', speedChange, false );
			}
		},

		/* -----------------------------
		// Changing Torus Mode
		----------------------------- */
		torusChangeRun: () => {
			const torusChange = () => {
				torus = ip_torus.checked;
			};
			ip_torus.addEventListener( 'change', torusChange, false );
		},

		/* -----------------------------
		// Randomizer
		----------------------------- */
		randomSetRun: () => {
			let	fv, cols2, rows2, start_x2, start_y2,
				grid_x, grid_x2, grid_x3, grid_x4,
				grid_y, grid_y2, grid_y3, grid_y4;
			const randomSet = () => {
				cv.clearRect( 0, 0, cols * sideSum, rows * sideSum );
				if( bt_play.value == 'stop' ){
					bt_play.click();
				}
				if( settings.randomizeMode == 'normal' ){
					for ( r = 0; r <= rows - 1; r++ ) {
						for ( c = 0; c <= cols - 1; c++ ) {
							fv = ( Math.random() * 2 ) | 0;
							if( fv ){
								start_x = c * sideSum;
								start_y = r * sideSum;
								cv.fillRect( start_x, start_y, side, side );
							}
							data[r][c] = fv;
						}
					}
				} else if( settings.randomizeMode == 'symmetryX' ){
					cols2 = cols >> 1;
					for ( r = 0; r <= rows - 1; r++ ) {
						for ( c = 0; c <= cols2 - 1; c++ ) {
							fv = ( Math.random() * 2 ) | 0;
							if( fv ){
								start_x = c * sideSum;
								start_x2 = ( cols - c - 1 ) * sideSum;
								start_y = r * sideSum;
								cv.fillRect( start_x, start_y, side, side );
								cv.fillRect( start_x2, start_y, side, side );
							}
							data[r][c] = fv;
							data[r][cols - c - 1] = fv;
						}
					}
				} else if( settings.randomizeMode == 'symmetryY' ){
					rows2 = rows >> 1;
					for ( r = 0; r <= rows2 - 1; r++ ) {
						for ( c = 0; c <= cols - 1; c++ ) {
							fv = ( Math.random() * 2 ) | 0;
							if( fv ){
								start_x = c * sideSum;
								start_y = r * sideSum;
								start_y2 = ( rows - r - 1 ) * sideSum;
								cv.fillRect( start_x, start_y, side, side );
								cv.fillRect( start_x, start_y2, side, side );
							}
							data[r][c] = fv;
							data[rows - r - 1][c] = fv;
						}
					}
				} else if( settings.randomizeMode == 'spiral' ){
					cols2 = cols >> 1;
					rows2 = rows >> 1;
					if( cols2 == rows2 ){
						for ( r = 0; r <= rows2 - 1; r++ ) {
							for ( c = 0; c <= cols2 - 1; c++ ) {
								fv = ( Math.random() * 2 ) | 0;
								grid_x = c;
								grid_y = r;
								grid_x2 = r;
								grid_y2 = rows - c - 1;
								grid_x3 = rows - c - 1;
								grid_y3 = rows - r - 1;
								grid_x4 = rows - r - 1;
								grid_y4 = c;

								if( fv ){
									cv.fillRect( grid_x * sideSum, grid_y * sideSum, side, side );
									cv.fillRect( grid_x2 * sideSum, grid_y2 * sideSum, side, side );
									cv.fillRect( grid_x3 * sideSum, grid_y3 * sideSum, side, side );
									cv.fillRect( grid_x4 * sideSum, grid_y4 * sideSum, side, side );
								}
								data[grid_y][grid_x] = fv;
								data[grid_y2][grid_x2] = fv;
								data[grid_y3][grid_x3] = fv;
								data[grid_y4][grid_x4] = fv;
							}
						}
					} else {
						for ( r = 0; r <= rows2 - 1; r++ ) {
							for ( c = 0; c <= cols2 - 1; c++ ) {
								fv = ( Math.random() * 2 ) | 0;
								start_x = c * sideSum;
								start_x2 = ( cols - c - 1 ) * sideSum;
								start_y = r * sideSum;
								start_y2 = ( rows - r - 1 ) * sideSum;
								if( fv ){
									cv.fillRect( start_x, start_y, side, side );
									cv.fillRect( start_x, start_y2, side, side );
									cv.fillRect( start_x2, start_y, side, side );
									cv.fillRect( start_x2, start_y2, side, side );
								}
								data[r][c] = fv;
								data[rows - r - 1][c] = fv;
								data[r][cols - c - 1] = fv;
								data[rows - r - 1][cols - c - 1] = fv;
							}
						}
					}
				}
				gen = 0;
				rate = 0;
				mode = 'random';
				func.speedChangeRun();
				func.evaluation();
			};
			bt_rnd.addEventListener( 'click', randomSet, true );
		},

		/* -----------------------------
		// Import, Export
		----------------------------- */
		modal: () => {
			let
				str = '',
				str_1, str_2;
			const
				lifeExport = () => {
					str = '';
					str += '#N no name\n';
					str += '#C export is gen.=' + gen + ',\n';
					str += '#C rate=' + rate + '\n';
					str += 'x = ' + cols + ', y = ' + rows + ', rule = ' + now_rule;
					if( torus ){
						str += ':T' + cols + ',' + rows + '\n';
					} else {
						str += '\n';
					}
					for ( r = 0; r <= rows - 1; r++ ) {
						join_c[r] = data[r].join('');
						join_c[r] = join_c[r].replace( /0/g, 'b' ).replace( /1/g, 'o' );
						join_c[r] = join_c[r].replace( /(bb+|oo+)/g, ( r0, r1 ) => r1.length + r1.charAt( 0 ) );
					}
					str += join_c.join( '$' ) + '!';
					tx_ex.value = str;
					tx_im.value = '';
				},
				lifeImport = () => {
					str = tx_im.value;
					str = str.replace( /#.*?\n/g, '' );
					if( str.indexOf('T:') != -1 ){
						torus = true;
						ip_torus.checked = true;
					} else {
						torus = false;
						ip_torus.checked = false;
					}
					str_1 = str.match( /^(x.*?)\n/ )[1].replace( /(\:.*?$|[ xy=]|rule)/g, '' ).split( ',' );
					cols = parseInt( str_1[0], 10 );
					rows = parseInt( str_1[1], 10 );
					rule = ( str_1.length >= 3 ) ? str_1[2] : 'B3/S23';
					str_2 = str.replace( /^[^bo\d\$].*?\n/gm, '' ).replace( /[^bo\d\$]/g, '' );
					str_2 = str_2.replace( /(\d+)(b|o|\$)/g, ( r0, r1, r2 ) => r2.repeat( parseInt( r1, 10 ) ) );
					str_2 = str_2.replace( /b/g, '0' ).replace( /o/g, '1' );
					str_2 = str_2.split( '\$' );
					ip_cols.value = cols;
					ip_rows.value = rows;
					life.width = cols * sideSum;
					life.style.width = cols * sideSum + 'px';
					life.height = rows * sideSum;
					life_bg.width = cols * sideSum;
					life_bg.style.width = cols * sideSum + 'px';
					life_bg.height = rows * sideSum;
					life_bg.style.marginTop = - ( rows * sideSum ) + 'px';
					cv.fillStyle = col[1];
					cv_bg.fillStyle = col[0];
					cv.clearRect( 0, 0, cols * sideSum, rows * sideSum );
					cv_bg.clearRect( 0, 0, cols * sideSum, rows * sideSum );
					data = [];
					for ( r = 0; r <= rows - 1; r++ ) {
						data[r] = [];
						for ( c = 0; c <= cols - 1; c++ ) {
							if( str_2[r] ) {
								fv = ( ( str_2[r] ).length > c ) ? parseInt( str_2[r].charAt( c ), 10 ) : 0;
							} else {
								fv = 0;
							}
							start_x = c * sideSum;
							start_y = r * sideSum;
							if( fv ) cv.fillRect( start_x, start_y, side, side );
							cv_bg.fillRect( start_x, start_y, side, side );
							data[r][c] = fv;
						}
					}
					func.ruleChange( rule );
				},
				modalControl = e => {
					ival = e.target.value;
					if( ival == 'import' ){
						modal.style.display = 'flex';
						tx_im.style.display = 'block';
						tx_ex.style.display = 'none';
					} else if( ival == 'export' ){
						lifeExport();
						modal.style.display = 'flex';
						tx_im.style.display = 'none';
						tx_ex.style.display = 'block';
					} else {
						modal.style.display = 'none';
						if( tx_im.value != '' ) lifeImport();
					}
					if( ival != 'close' && bt_play.value == 'stop' ) bt_play.click();
				};
			bt_im.addEventListener( 'click', modalControl, true );
			bt_ex.addEventListener( 'click', modalControl, true );
			bt_mclose.addEventListener( 'click', modalControl, true );
		},

		/* -----------------------------
		// Move coordinate axes
		----------------------------- */
		moveRun: () => {
			const move = e => {
				ival = e.target.id;
				if( bt_play.value == 'stop' ){
					bt_play.click();
				}
				switch( ival ){
					case 'up':
						for ( r = 0; r <= rows - 1; r++ ) {
							if( !torus && r == rows - 1 ){
								dataNext[r] = 0;
							} else {
								dataNext[r] = data[ ( r + 1 ) % rows ];
							}
							for ( c = 0; c <= cols - 1; c++ ) {
								if( data[r][c] ^ dataNext[r][c] ){
									if( dataNext[r][c] ){
										cv.fillRect( c * sideSum, r * sideSum, side, side );
									} else {
										cv.clearRect( c * sideSum, r * sideSum, side, side );
									}
								}
							}
						}
						break;
					case 'down':
						for ( r = 0; r <= rows - 1; r++ ) {
							if( !torus && !r ){
								dataNext[r] = 0;
							} else {
								dataNext[r] = data[ ( r - 1 + rows ) % rows ];
							}
							for ( c = 0; c <= cols - 1; c++ ) {
								if( data[r][c] ^ dataNext[r][c] ){
									if( dataNext[r][c] ){
										cv.fillRect( c * sideSum, r * sideSum, side, side );
									} else {
										cv.clearRect( c * sideSum, r * sideSum, side, side );
									}
								}
							}
						}
						break;
					case 'left':
						for ( r = 0; r <= rows - 1; r++ ) {
							dataNext[r] = [];
							for ( c = 0; c <= cols - 1; c++ ) {
								if( !torus && c == cols - 1 ){
									dataNext[r][c] = 0;
								} else {
									dataNext[r][c] = data[r][ ( c + 1 ) % cols ];
								}
								if( data[r][c] ^ dataNext[r][c] ){
									if( dataNext[r][c] ){
										cv.fillRect( c * sideSum, r * sideSum, side, side );
									} else {
										cv.clearRect( c * sideSum, r * sideSum, side, side );
									}
								}
							}
						}
						break;
					case 'right':
						for ( r = 0; r <= rows - 1; r++ ) {
							dataNext[r] = [];
							for ( c = 0; c <= cols - 1; c++ ) {
								if( !torus && !c ){
									dataNext[r][c] = 0;
								} else {
									dataNext[r][c] = data[r][ ( c - 1 + cols ) % cols ];
								}
								if( data[r][c] ^ dataNext[r][c] ){
									if( dataNext[r][c] ){
										cv.fillRect( c * sideSum, r * sideSum, side, side );
									} else {
										cv.clearRect( c * sideSum, r * sideSum, side, side );
									}
								}
							}
						}
						break;
				}
				data = dataNext.slice();
			};
			bt_left.addEventListener( 'click', move, true );
			bt_right.addEventListener( 'click', move, true );
			bt_down.addEventListener( 'click', move, true );
			bt_up.addEventListener( 'click', move, true );
		},

		/* -----------------------------
		// For test
		----------------------------- */
		test: () => {
			//console.log( 'test' );
		}

	};
	func.init();

	// API
	return false;
	//{test: func.test};
})();

//lifeModule.test();