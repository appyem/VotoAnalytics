export default function TrafficLight({ status }: { status: "up" | "down" | "stable" }) {
  const colors = { up: "bg-success", down: "bg-danger", stable: "bg-warning" };
  return <div className={`w-4 h-4 rounded-full ${colors[status]} animate-pulse`} />;
}