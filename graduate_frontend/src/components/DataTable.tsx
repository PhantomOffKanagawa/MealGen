'use client';

import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, useTheme, alpha
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export interface Column {
  id: string;
  label: string;
  format?: (value: any, row: any) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  color: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  getRowId: (row: any) => string | number;
  actions?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  color,
  onEdit,
  onDelete,
  getRowId,
  actions = true
}) => {
  const theme = useTheme();

  // Helper function to get value from potentially nested property path
  const getNestedValue = (obj: any, path: string) => {
    const keys = path.split('.');
    return keys.reduce((acc, key) => 
      acc && acc[key] !== undefined ? acc[key] : undefined, obj);
  };

  return (
    <TableContainer 
      component={Paper}
      sx={{
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: `0 8px 24px ${alpha(theme.palette[color].main, 0.15)}`,
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
        position: 'relative',
        transition: 'all 0.3s ease',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          borderRadius: '12px',
          padding: '1px',
          background: `linear-gradient(45deg, ${alpha(theme.palette[color].light, 0.6)}, transparent, ${alpha(theme.palette[color].main, 0.6)})`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none'
        },
        '&:hover': {
          boxShadow: `0 12px 28px ${alpha(theme.palette[color].main, 0.25)}`,
        },
        marginBottom: '20px',
      }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ 
            background: `linear-gradient(90deg, ${alpha(theme.palette[color].dark, 0.15)}, ${alpha(theme.palette[color].main, 0.05)})`,
            '& .MuiTableCell-head': { 
              fontWeight: 'bold',
              color: theme.palette[color].dark,
              borderBottom: `2px solid ${alpha(theme.palette[color].light, 0.3)}`,
              py: 1.5
            }
          }}>
            {columns.map((column) => (
              <TableCell key={column.id} align={column.align || 'left'}>
                {column.label}
              </TableCell>
            ))}
            {actions && <TableCell align="center">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow 
              key={getRowId(row)}
              sx={{
                background: index % 2 === 0 ? 'transparent' : alpha(theme.palette[color].light, 0.03),
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: alpha(theme.palette[color].light, 0.07),
                  boxShadow: `inset 0 0 15px ${alpha(theme.palette[color].main, 0.05)}`,
                }
              }}
            >
              {columns.map((column) => (
                <TableCell key={`${getRowId(row)}-${column.id}`} align={column.align || 'left'}>
                  {column.format 
                    ? column.format(getNestedValue(row, column.id), row)
                    : getNestedValue(row, column.id)}
                </TableCell>
              ))}
              {actions && (
                <TableCell align="center">
                  {onEdit && (
                    <IconButton 
                      color={color} 
                      onClick={() => onEdit(row)}
                      aria-label="edit"
                      size="small"
                      sx={{
                        boxShadow: `0 0 8px ${alpha(theme.palette[color].main, 0.2)}`,
                        mr: 1,
                        '&:hover': {
                          background: alpha(theme.palette[color].main, 0.1),
                          boxShadow: `0 0 12px ${alpha(theme.palette[color].main, 0.4)}`,
                        }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton 
                      color="error" 
                      onClick={() => onDelete(row)}
                      aria-label="delete"
                      size="small"
                      sx={{
                        boxShadow: `0 0 8px ${alpha(theme.palette.error.main, 0.2)}`,
                        '&:hover': {
                          background: alpha(theme.palette.error.main, 0.1),
                          boxShadow: `0 0 12px ${alpha(theme.palette.error.main, 0.4)}`,
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
