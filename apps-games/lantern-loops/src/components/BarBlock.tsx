import { Card } from "@web-games/kit";
import { BarChart, type BarChartProps } from "./BarChart";

export interface BarBlockProps extends BarChartProps {
  title: string;
}

export function BarBlock({ title, ...chart }: BarBlockProps) {
  return (
    <Card title={title}>
      <BarChart {...chart} />
    </Card>
  );
}
