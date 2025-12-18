"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { DataGrid, GridColDef, GridActionsCellItem } from "@mui/x-data-grid";
import { CVRecord } from "../services/atsService";

interface CVListSectionProps {
  cvRecords: CVRecord[];
  onViewDetails: (cvId: string) => void;
  onDelete: (cvId: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export default function CVListSection({
  cvRecords,
  onViewDetails,
  onDelete,
  onRefresh,
  loading,
}: CVListSectionProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "info";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "error";
  };

  const columns: GridColDef[] = [
    {
      field: "filename",
      headerName: "CV Filename",
      flex: 1,
      minWidth: 200,
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value.toUpperCase()}
          color={getStatusColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: "score",
      headerName: "Score",
      width: 100,
      renderCell: (params) => {
        if (!params.value && params.value !== 0) return "-";
        return (
          <Chip
            label={params.value}
            color={getScoreColor(params.value) as any}
            size="small"
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Uploaded",
      width: 180,
      valueFormatter: (params) => {
        return new Date(params).toLocaleString();
      },
    },
    {
      field: "processedAt",
      headerName: "Processed",
      width: 180,
      valueFormatter: (params) => {
        return params ? new Date(params).toLocaleString() : "-";
      },
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={
            <Tooltip title="View Details">
              <VisibilityIcon />
            </Tooltip>
          }
          label="View"
          onClick={() => onViewDetails(params.row.id)}
          showInMenu={false}
        />,
        <GridActionsCellItem
          icon={
            <Tooltip title="Delete">
              <DeleteIcon />
            </Tooltip>
          }
          label="Delete"
          onClick={() => onDelete(params.row.id)}
          showInMenu={false}
        />,
      ],
    },
  ];

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">CV Analysis History</Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={loading}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        <Box sx={{ height: 400, width: "100%" }}>
          <DataGrid
            rows={cvRecords}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
              sorting: {
                sortModel: [{ field: "createdAt", sort: "desc" }],
              },
            }}
            disableRowSelectionOnClick
            sx={{
              "& .MuiDataGrid-cell:focus": {
                outline: "none",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "action.hover",
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
