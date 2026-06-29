import { ToggleButton, ToggleButtonGroup } from "@mui/material";

const filters = ["All", "Placement", "Result", "Event"];

export function NotificationFilter({ value, onChange }) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={onChange}
      size="small"
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
      }}
    >
      {filters.map((type) => (
        <ToggleButton
          key={type}
          value={type}
          sx={{
            textTransform: "none",
            px: 2,
          }}
        >
          {type}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}