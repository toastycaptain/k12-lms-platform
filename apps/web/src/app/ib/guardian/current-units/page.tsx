import { CurrentUnitWindow } from "@/features/ib/guardian/CurrentUnitWindow";
import { IbWorkspaceScaffold, WorkspacePanel } from "@/features/ib/shared/IbWorkspaceScaffold";

export default function GuardianCurrentUnitsPage() {
  return (
    <IbWorkspaceScaffold
      title="Current units"
      description="Families see what is being learned now in supportive, plain language."
      main={
        <WorkspacePanel
          title="Current learning"
          description="No internal review language leaks into this family view."
        >
          <CurrentUnitWindow />
        </WorkspacePanel>
      }
    />
  );
}
