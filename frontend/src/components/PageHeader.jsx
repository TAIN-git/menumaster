import { Box, Typography, Button } from '@mui/material';

const PageHeader = ({ title, subtitle, actionLabel, actionIcon, onAction, actionColor = 'primary', actionVariant = 'contained' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="h4" component="h1" gutterBottom={!!subtitle}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {actionLabel && (
        <Button
          variant={actionVariant}
          color={actionColor}
          startIcon={actionIcon}
          onClick={onAction}
          size="large"
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default PageHeader;
