"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import PersonnelSheet from "./PersonnelSheet";
import type { Personnel, JobType, TechStack, Level, Domain } from "@/types";

interface Props {
  personnel: Personnel;
  vendors: { id: string; name: string }[];
  jobTypes: JobType[];
  techStacks: TechStack[];
  levels: Level[];
  domains: Domain[];
  isDULeader: boolean;
}

export default function PersonnelEditSection({
  personnel,
  vendors,
  jobTypes,
  techStacks,
  levels,
  domains,
  isDULeader,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit</Button>
      <PersonnelSheet
        open={open}
        onClose={() => setOpen(false)}
        personnel={personnel}
        vendors={vendors}
        jobTypes={jobTypes}
        techStacks={techStacks}
        levels={levels}
        domains={domains}
        isDULeader={isDULeader}
      />
    </>
  );
}
