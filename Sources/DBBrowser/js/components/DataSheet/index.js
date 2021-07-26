import _ from 'lodash';
import React from 'react';
import { View, Text } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { EJSON } from 'bson';

import DataSheetHeader from './DataSheetHeader';
import ValueViewer from './ValueViewer';

function _encode_data(value) {
    
    if (_.isNull(value)) {
      return 'null';
    }
    
    if (_.isUndefined(value)) {
      return 'undefined';
    }
    
    if (_.isBoolean(value)) {
      return `${value}`;
    }
    
    if (_.isNumber(value)) {
      return `${value}`;
    }
    
    if (_.isDate(value)) {
      return value.toLocaleString();
    }

    if (_.isString(value)) {
      return value;
    }

    switch (value._bsontype) {

      case 'Binary':

      switch (value.sub_type) {

        case Binary.SUBTYPE_UUID:

          let uuid = new UUID(value.buffer);
          return uuid.toHexString(true);

        case Binary.SUBTYPE_MD5:

          return value.buffer.toString('hex');
  
        default: return value.buffer.toString('base64');
      }

      case 'BSONRegExp':

        return `/${value.pattern}/${value.options}`;

      case 'Symbol':

        return value.valueOf();

      case 'Double':
      case 'Int32':

        return value.valueOf();

      case 'Decimal128':
      case 'Long':

        return value.toString();

      case 'MaxKey':

        return 'MaxKey';

      case 'MinKey':

        return 'MinKey';

      case 'ObjectId':
      case 'ObjectID':

        return value.toHexString();

      case 'UUID':

        return value.toHexString(true);

      default: return EJSON.stringify(value);
    }
}

export default class DataSheet extends React.PureComponent {

	constructor(props) {
		super(props);

		this.onMouseUp = this.onMouseUp.bind(this);
		this.pageClick = this.pageClick.bind(this);
		this.handleKey = this.handleKey.bind(this);
		this.handleCopy = this.handleCopy.bind(this);
		this.handlePaste = this.handlePaste.bind(this);

		this.state = {
			editing: null,
			selecting_rows: null,
			selected_rows: [],
			selecting_cells: null,
			selected_cells: null,
			shiftKey: false,
			metaKey: false,
			token: uuidv4(),
		};
	}

	componentDidMount() {
		document.addEventListener('mousedown', this.pageClick);
		document.addEventListener('keydown', this.handleKey);
		document.addEventListener('copy', this.handleCopy);
		document.addEventListener('paste', this.handlePaste);
	}

	componentWillUnmount() {
		document.removeEventListener('mousedown', this.pageClick);
		document.removeEventListener('mouseup', this.onMouseUp);
		document.removeEventListener('keydown', this.handleKey);
		document.removeEventListener('copy', this.handleCopy);
		document.removeEventListener('paste', this.handlePaste);
	}

	_current_selected_rows(e) {

		if (_.isEmpty(this.state.selecting_rows)) {
			return this.state.selected_rows;
		}

		const min_row = Math.min(this.state.selecting_rows.start_row, this.state.selecting_rows.end_row);
		const max_row = Math.max(this.state.selecting_rows.start_row, this.state.selecting_rows.end_row);

		if (e.shiftKey) {

			const selecting_rows = new Set(this.state.selected_rows);

			for (let row = min_row; row <= max_row; row++) {
				selecting_rows.add(row);
			}
	
			return [...selecting_rows].sort();
		} 
		
		if (e.metaKey) {

			const selecting_rows = new Set(this.state.selected_rows);

			for (let row = min_row; row <= max_row; row++) {
				if (selecting_rows.has(row)) {
					selecting_rows.delete(row);
				} else {
					selecting_rows.add(row);
				}
			}
	
			return [...selecting_rows].sort();
		} 

		const selecting_rows = new Set();

		for (let row = min_row; row <= max_row; row++) {
			selecting_rows.add(row);
		}
	
		return [...selecting_rows].sort();
	}
	
	onMouseUp(e) {

		document.removeEventListener('mouseup', this.onMouseUp);

		if (!_.isEmpty(this.state.selecting_rows)) {

			const selected_rows = this._current_selected_rows(e);
		
			this.setState({ selecting_rows: null, selected_rows, selected_cells: null });
		}

		if (!_.isEmpty(this.state.selecting_cells)) {

			this.setState({ selecting_cells: null, selected_cells: this.state.selecting_cells, selected_rows: [] });
		}
	}
  
	handleRowMouseDown(e, row) {

		if (!_.isEmpty(this.state.editing)) return;

		document.addEventListener('mouseup', this.onMouseUp);

		this.setState({ selecting_rows: { start_row: row, end_row: row }, shiftKey: e.shiftKey, metaKey: e.metaKey });
	}
  
	handleRowMouseOver(e, row) {

		if (_.isEmpty(this.state.selecting_rows)) return;

		this.setState({ selecting_rows: { ...this.state.selecting_rows, end_row: row }, shiftKey: e.shiftKey, metaKey: e.metaKey });
	}
  
	handleCellMouseDown(e, row, col) {

		if (!_.isEmpty(this.state.editing)) return;

		document.addEventListener('mouseup', this.onMouseUp);

		this.setState({ selecting_cells: { start_row: row, start_col: col, end_row: row, end_col: col } });
	}
  
	handleCellMouseOver(e, row, col) {

		if (_.isEmpty(this.state.selecting_cells)) return;

		this.setState({ selecting_cells: { ...this.state.selecting_cells, end_row: row, end_col: col } });
	}
  
	handleCellDoubleClick(e, row, col) {
		console.log(e);
	}

	pageClick(e) {

		if (!_.isEmpty(this.state.selected_rows) || !_.isEmpty(this.state.selected_cells)) {

			let node = e.target;

			while (node !== document) {
				if (node === this.tableRef) {
					return;
				}
				node = node.parentNode;
			}

			this.setState({ selecting_rows: null, selected_rows: [], selecting_cells: null, selected_cells: null });
		}
	}

	handleKey(e) {

		if (e.ctrlKey) {
			if (e.keyCode === 67) {
			  this.handleCopy(e);
			} else if (e.keyCode === 86 || e.which === 86) {
			  this.handlePaste(e);
			}
		}

		if (e.keyCode === 8 || e.keyCode === 46) {
			this.handleDelete(e);
		}
	}

	handleDelete(e) {

		if (!_.isEmpty(this.state.editing)) return;

		if (!_.isEmpty(this.state.selected_rows)) {

			e.preventDefault();
			
			if (this.props.handleDeleteRows) {
				this.props.handleDeleteRows(this.state.selected_rows.sort());
			}
		}

		if (!_.isEmpty(this.state.selected_cells)) {

			e.preventDefault();
			
			if (this.props.handleDeleteCells) {
				this.props.handleDeleteCells(this.state.selected_cells);
			}
		}
	}

	encodeData(value) {

		if (this.props.encodeData) {
			return this.props.encodeData(value);
		}

		return `${_encode_data(value)}`.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r');
	}

	handleCopy(e) {

		if (!_.isEmpty(this.state.editing)) return;

		if (!_.isEmpty(this.state.selected_rows)) {

			e.preventDefault();
			
			const selected_rows = this.state.selected_rows.sort();
			const data = selected_rows.map(row => Object.fromEntries(this.props.columns.map((col, i) => [col, this.props.data[row][i]])));
			
			if (this.props.handleCopyRows) {

				this.props.handleCopyRows(selected_rows, data);

			} else {

				e.clipboardData.setData('application/json', EJSON.stringify(data));
				
				const text = data.map(x => Object.values(x).map(x => this.encodeData(x)).join('\t')).join('\n');
				e.clipboardData.setData('text/plain', text);
			}
		}

		if (!_.isEmpty(this.state.selected_cells)) {

			e.preventDefault();
			
			const { start_row, start_col, end_row, end_col } = this.state.selected_cells;

			const min_row = Math.min(start_row, end_row);
			const max_row = Math.max(start_row, end_row);
			const min_col = Math.min(start_col, end_col);
			const max_col = Math.max(start_col, end_col);
	
			const _rows = _.range(min_row, max_row + 1);
			const _cols = _.range(min_col, max_col + 1);
			const data = _rows.map(row => Object.fromEntries(_cols.map(col => [this.props.columns[col], this.props.data[row][col]])))

			if (this.props.handleCopyCells) {

				this.props.handleCopyCells({ start_row, start_col, end_row, end_col }, data);

			} else {
				
				e.clipboardData.setData('application/json', EJSON.stringify(data));
				
				const text = data.map(x => Object.values(x).map(x => this.encodeData(x)).join('\t')).join('\n');
				e.clipboardData.setData('text/plain', text);
			}
		}
	}

	handlePaste(e) {

		if (!_.isEmpty(this.state.editing)) return;

		if (!_.isEmpty(this.state.selected_rows)) {

			e.preventDefault();
			
			if (this.props.handlePasteRows) {
				this.props.handlePasteRows(this.state.selected_rows.sort());
			}
		}

		if (!_.isEmpty(this.state.selected_cells)) {

			e.preventDefault();
			
			if (this.props.handlePasteCells) {
				this.props.handlePasteCells(this.state.selected_cells);
			}
		}
	}
  
	render() {
	
		const selected_rows = _.isEmpty(this.state.selecting_cells) ? this._current_selected_rows(this.state) : [];
		const selected_cells = _.isEmpty(this.state.selecting_rows) ? this.state.selecting_cells ?? this.state.selected_cells : null;
		
		const is_row_selected = (row) => selected_rows.includes(row);
	
		const is_cell_bound = (select, row, col) => {
			const min_row = Math.min(select.start_row, select.end_row);
			const max_row = Math.max(select.start_row, select.end_row);
			const min_col = Math.min(select.start_col, select.end_col);
			const max_col = Math.max(select.start_col, select.end_col);
			return min_row <= row && row <= max_row && min_col <= col && col <= max_col;
		}

		const is_cell_selected = (row, col) => selected_cells && is_cell_bound(selected_cells, row, col);
	
		return <table
				ref={x => this.tableRef = x}
				style={{ 
					borderCollapse: 'collapse',
					userSelect: 'none',
					MozUserSelect: 'none',
					WebkitUserSelect: 'none',
					msUserSelect: 'none',
				}}>
			<DataSheetHeader {...this.props} />
			<tbody style={{ backgroundColor: 'white' }}>
			{this.props.data.map((rows, row) => <tr key={`${this.state.token}-row-${row}`} style={{ backgroundColor: row % 2 == 0 ? 'white' : '#F6F8FF' }}>
				<td 
					onMouseDown={(e) => this.handleRowMouseDown(e, row)}
					onMouseOver={(e) => this.handleRowMouseOver(e, row)}
					style={{
						padding: 4,
						overflow: 'hidden',
						border: 1,
						borderStyle: is_row_selected(row) ? 'double' : 'solid',
						borderColor: is_row_selected(row) ? '#2185D0' : '#DDD',
						boxShadow: is_row_selected(row) ? 'inset 0 -100px 0 rgba(33, 133, 208, 0.15)' : null,
					}}>
					<Text style={{ fontFamily: 'monospace' }}>{row + 1}</Text>
				</td>
				{rows.map((value, col) => <td 
					key={`${this.state.token}-col-${col}`}
					onMouseDown={(e) => this.handleCellMouseDown(e, row, col)}
					onMouseOver={(e) => this.handleCellMouseOver(e, row, col)}
					onDoubleClick={(e) => this.handleCellDoubleClick(e, row, col)}
					style={{
						padding: 0,
						position: 'relative',
						border: 1,
						cursor: 'cell',
						borderStyle: is_row_selected(row) || is_cell_selected(row, col) ? 'double' : 'solid',
						borderColor: is_row_selected(row) || is_cell_selected(row, col) ? '#2185D0' : '#DDD',
						boxShadow: is_row_selected(row) || is_cell_selected(row, col) ? 'inset 0 -100px 0 rgba(33, 133, 208, 0.15)' : null,
					}}>
					<View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
						<View style={{ padding: 4 }}><ValueViewer value={value} /></View>
					</View>
				</td>)}
			</tr>)}
			</tbody>
		</table>;
	}
}
