import _ from 'lodash';
import React from 'react';
import { View, Text } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import DataSheetHeader from './DataSheetHeader';
import ValueViewer from './ValueViewer';

export default class DataSheet extends React.PureComponent {

	constructor(props) {
		super(props);

		this.onMouseUp = this.onMouseUp.bind(this);
	
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

	_current_selected_rows(e) {

		if (_.isEmpty(this.state.selecting_rows)) {
			return this.state.selected_rows;
		}

		let min_row = Math.min(this.state.selecting_rows.start_row, this.state.selecting_rows.end_row);
		let max_row = Math.max(this.state.selecting_rows.start_row, this.state.selecting_rows.end_row);

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
  
	render() {
	
		const { 
			data,
			...props 
		} = this.props;

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
				style={{ 
					borderCollapse: 'collapse',
					userSelect: 'none',
					MozUserSelect: 'none',
					WebkitUserSelect: 'none',
					msUserSelect: 'none',
				}}>
			<DataSheetHeader {...this.props} />
			<tbody style={{ backgroundColor: 'white' }}>
			{data.map((rows, row) => <tr key={`${this.state.token}-row-${row}`} style={{ backgroundColor: row % 2 == 0 ? 'white' : '#F6F8FF' }}>
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
